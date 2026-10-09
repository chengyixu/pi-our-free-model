import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeContext } from "@earendil-works/pi-ai";
import { createFreeProvider } from "../src/provider.ts";

test("Zen requires authorized discovery and never uses pooled keys or fake client identity", async () => {
  const original = process.env.OPENCODE_API_KEY;
  delete process.env.OPENCODE_API_KEY;
  let hits = 0;
  const fetch: typeof globalThis.fetch = async (url, init) => {
    hits++;
    const request = new Request(url, init);
    assert.equal(request.headers.get("authorization"), "Bearer authorized-test-key");
    assert.match(request.headers.get("user-agent")!, /^pi-our-free-model\//);
    assert.equal(request.headers.get("x-opencode-client"), null);
    if (request.url.endsWith("/models")) return new Response(JSON.stringify({ data: [{ id: "mimo-v2.6-flash-free" }] }));
    const body = await request.json() as { tools?: unknown[]; messages: unknown[] };
    assert.ok(!body.tools?.length, "No fake tools added to pass an upstream gate");
    return new Response('data: {"id":"test","choices":[{"index":0,"delta":{"content":"authorized"},"finish_reason":null}]}\n\ndata: {"id":"test","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', { headers: { "content-type": "text/event-stream" } });
  };
  try {
    const provider = createFreeProvider("zen", { fetch });
    const publication = { allowNetwork: true, force: true, signal: new AbortController().signal,
      publish: async (p: { update?: () => void }) => { p.update?.(); return true; } };
    await provider.refreshModels!(publication);
    assert.equal(hits, 0);
    assert.equal(await provider.auth.apiKey!.resolve({ ctx: { env: async () => undefined, fileExists: async () => false }, signal: publication.signal }), undefined);
    await provider.refreshModels!({ ...publication, credential: { type: "api_key", key: "authorized-test-key" } });
    const result = await provider.streamSimple(provider.getModels()[0], normalizeContext({ messages: [{ role: "user", content: "test", timestamp: 1 }] }), { apiKey: "authorized-test-key" }).result();
    assert.equal(result.stopReason, "stop");
    assert.equal(result.content.find(b => b.type === "text")?.text, "authorized");
    assert.equal(hits, 2);
  } finally {
    if (original === undefined) delete process.env.OPENCODE_API_KEY;
    else process.env.OPENCODE_API_KEY = original;
  }
});
