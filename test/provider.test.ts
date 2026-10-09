import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { test } from "node:test";
import type { RefreshModelsContext } from "@earendil-works/pi-ai";
import { normalizeContext } from "@earendil-works/pi-ai";
import { createFreeProvider } from "../src/provider.ts";

const row = { id: "poolside/laguna-xs-2.1:free", isFree: true, context_length: 262144,
  top_provider: { max_completion_tokens: 32768 }, supported_parameters: ["tools", "reasoning"] };
async function fixture(fn: (server: Server, base: string) => Promise<void>) {
  const server = createServer();
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try { await fn(server, `http://127.0.0.1:${address.port}`); }
  finally { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); }
}
function refreshContext(overrides: Partial<RefreshModelsContext> = {}): RefreshModelsContext {
  return { allowNetwork: true, force: true, signal: new AbortController().signal,
    publish: async publication => { publication.update?.(); return true; }, ...overrides };
}
function frame(delta: object, finish: string | null = null, usage?: object): string {
  return `data: ${JSON.stringify({ id: "fixture", object: "chat.completion.chunk", created: 1,
    model: row.id, choices: [{ index: 0, delta, finish_reason: finish }], usage })}\n\n`;
}

test("discovery publishes persistent state; rate-limit failure retains it; offline mode does no I/O", async () => {
  await fixture(async (server, base) => {
    let hits = 0;
    server.on("request", (_req, res) => { hits++; res.writeHead(hits === 1 ? 200 : 429, { "content-type": "application/json" });
      res.end(JSON.stringify(hits === 1 ? { data: [row] } : { error: "quota reached" })); });
    const provider = createFreeProvider("kilo", { baseUrl: base });
    let saved: unknown;
    await provider.refreshModels!(refreshContext({ publish: async p => { saved = p.persist; p.update?.(); return true; } }));
    assert.deepEqual(provider.getModels().map(m => m.id), [row.id]);
    assert.ok(saved);
    await assert.rejects(provider.refreshModels!(refreshContext()), /429/);
    assert.equal(provider.getModels().length, 1);
    await provider.refreshModels!(refreshContext({ allowNetwork: false }));
    assert.equal(hits, 2);
  });
});

test("cache restore rejects foreign endpoints and stale publication cannot install state", async () => {
  await fixture(async (server, base) => {
    server.on("request", (_req, res) => res.end(JSON.stringify({ data: [row] })));
    const provider = createFreeProvider("kilo", { baseUrl: base });
    await provider.refreshModels!(refreshContext({ publish: async () => false }));
    assert.equal(provider.getModels().length, 0);
    await provider.refreshModels!(refreshContext());
    const model = provider.getModels()[0];
    const restored = createFreeProvider("kilo", { baseUrl: base });
    await restored.refreshModels!(refreshContext({ allowNetwork: false, stored: {
      models: [{ ...model, baseUrl: "https://foreign.invalid" }, model], checkedAt: 1,
    } }));
    assert.deepEqual(restored.getModels().map(m => m.baseUrl), [base]);
  });
});

test("keyless streaming sends no Authorization, preserves instrumentation and normalizes Unicode/usage", async () => {
  await fixture(async (server, base) => {
    let request: Record<string, unknown> = {};
    let headers: Record<string, unknown> = {};
    server.on("request", async (req, res) => {
      if (req.url === "/models") { res.end(JSON.stringify({ data: [row] })); return; }
      let body = ""; for await (const part of req) body += part;
      request = JSON.parse(body); headers = req.headers;
      // Deliberately lying header, as encountered by upstream OFM.
      res.writeHead(200, { "content-type": "application/json", "x-fixture": "yes" });
      const bytes = Buffer.from(frame({ role: "assistant", reasoning: "thinking" }) + frame({ content: "你好 π" }) +
        frame({}, "stop", { prompt_tokens: 12, completion_tokens: 5, total_tokens: 17 }) + "data: [DONE]\n\n");
      for (let i = 0; i < bytes.length; i++) res.write(bytes.subarray(i, i + 1));
      res.end();
    });
    const provider = createFreeProvider("kilo", { baseUrl: base });
    await provider.refreshModels!(refreshContext());
    const context = normalizeContext({ messages: [{ role: "user", content: "hello", timestamp: 1 }] });
    let responses = 0, rawEvents = 0;
    const result = await provider.streamSimple(provider.getModels()[0], context, {
      apiKey: "never-send-this", maxTokens: 512,
      onPayload: payload => ({ ...payload as object, fixture_marker: true }),
      onResponse: response => { assert.equal(response.headers["x-fixture"], "yes"); responses++; },
      onProviderStreamEvent: () => { rawEvents++; },
    }).result();
    assert.equal(result.stopReason, "stop");
    assert.equal(result.content.find(b => b.type === "text")?.text, "你好 π");
    assert.equal(result.content.find(b => b.type === "thinking")?.thinking, "thinking");
    assert.equal(result.usage.totalTokens, 17);
    assert.equal(result.usage.cost.total, 0);
    assert.equal(headers.authorization, undefined);
    assert.match(String(headers["user-agent"]), /^pi-our-free-model\//);
    assert.deepEqual(request.reasoning, { enabled: false });
    assert.equal(request.fixture_marker, true);
    assert.equal(request.max_tokens, 512);
    assert.equal(responses, 1);
    assert.ok(rawEvents >= 3);
  });
});

test("real Pi tool call/result round-trip retains arguments and user tool names", async () => {
  await fixture(async (server, base) => {
    let round = 0;
    server.on("request", async (req, res) => {
      if (req.url === "/models") { res.end(JSON.stringify({ data: [row] })); return; }
      let body = ""; for await (const part of req) body += part;
      const payload = JSON.parse(body);
      res.writeHead(200, { "content-type": "text/event-stream" });
      if (round++ === 0) {
        assert.deepEqual(payload.tools.map((t: { function: { name: string } }) => t.function.name), ["get_weather"]);
        res.end(frame({ tool_calls: [{ index: 0, id: "call_weather", type: "function", function: { name: "get_weather", arguments: '{"city":"Paris"}' } }] }) + frame({}, "tool_calls") + "data: [DONE]\n\n");
      } else {
        assert.ok(payload.messages.some((m: { role: string; content: string }) => m.role === "tool" && m.content.includes("22C")));
        res.end(frame({ content: "Paris: 22C" }) + frame({}, "stop") + "data: [DONE]\n\n");
      }
    });
    const provider = createFreeProvider("kilo", { baseUrl: base });
    await provider.refreshModels!(refreshContext());
    const model = provider.getModels()[0];
    const messages = [{ role: "user" as const, content: "weather?", timestamp: 1 }];
    const tools = [{ name: "get_weather", description: "Weather", parameters: { type: "object" as const, properties: { city: { type: "string" } } } }];
    const first = await provider.streamSimple(model, normalizeContext({ messages, tools })).result();
    assert.equal(first.stopReason, "toolUse");
    const call = first.content.find(b => b.type === "toolCall");
    assert.equal(call?.name, "get_weather");
    assert.deepEqual(call?.arguments, { city: "Paris" });
    const second = await provider.streamSimple(model, normalizeContext({ messages: [...messages, first,
      { role: "toolResult", toolCallId: "call_weather", toolName: "get_weather", content: [{ type: "text", text: "22C" }], isError: false, timestamp: 2 }], tools })).result();
    assert.equal(second.content.find(b => b.type === "text")?.text, "Paris: 22C");
  });
});

for (const mode of ["truncated", "error", "abort"] as const) {
  test(`${mode} is not a successful empty answer and is never silently replayed`, async () => {
    await fixture(async (server, base) => {
      let inference = 0;
      const controller = new AbortController();
      server.on("request", (req, res) => {
        if (req.url === "/models") { res.end(JSON.stringify({ data: [row] })); return; }
        inference++;
        if (mode === "error") { res.writeHead(429); res.end(JSON.stringify({ error: { message: "quota reached" } })); return; }
        res.writeHead(200, { "content-type": "text/event-stream" });
        res.write(frame({ content: "partial" }));
        if (mode === "truncated") res.end();
        else controller.abort();
      });
      const provider = createFreeProvider("kilo", { baseUrl: base });
      await provider.refreshModels!(refreshContext());
      const result = await provider.streamSimple(provider.getModels()[0], normalizeContext({ messages: [{ role: "user", content: "test", timestamp: 1 }] }), { signal: controller.signal }).result();
      assert.equal(result.stopReason, mode === "abort" ? "aborted" : "error");
      assert.ok(result.errorMessage);
      assert.equal(inference, 1);
    });
  });
}
