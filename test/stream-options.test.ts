import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeContext } from "@earendil-works/pi-ai";
import { createFreeProvider } from "../src/provider.ts";

for (const [method, option] of [["stream", { reasoningEffort: "low" }], ["streamSimple", { reasoning: "low" }]] as const) {
  test(`${method} forwards the requested reasoning level, not the off default`, async () => {
    let reasoning: unknown;
    const provider = createFreeProvider("kilo", { fetch: async (url, init) => {
      const request = new Request(url, init);
      if (request.url.endsWith("/models")) return new Response(JSON.stringify({ data: [{
        id: "example:free", isFree: true, supported_parameters: ["tools", "reasoning"],
      }] }));
      const body = await request.json() as Record<string, unknown>;
      reasoning = body.reasoning;
      return new Response('data: {"id":"empty","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}\n\ndata: [DONE]\n\n', { headers: { "content-type": "text/event-stream" } });
    } });
    await provider.refreshModels!({ allowNetwork: true, force: true, signal: new AbortController().signal,
      publish: async p => { p.update?.(); return true; } });
    const model = provider.getModels()[0];
    const context = normalizeContext({ messages: [{ role: "user", content: "test", timestamp: 1 }] });
    const message = await provider[method](model, context, option).result();
    assert.equal(message.stopReason, "stop");
    assert.deepEqual(reasoning, { effort: "low" });
  });
}
