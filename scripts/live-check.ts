import assert from "node:assert/strict";
import { normalizeContext } from "@earendil-works/pi-ai";
import { createFreeProvider } from "../src/provider.ts";

// Opt-in: sends a harmless prompt to Kilo and consumes upstream free allowance.
const provider = createFreeProvider("kilo");
await provider.refreshModels!({ allowNetwork: true, force: true, signal: AbortSignal.timeout(20000),
  publish: async p => { p.update?.(); return true; } });
const model = provider.getModels().find(m => m.id === "poolside/laguna-xs-2.1:free");
assert.ok(model, "Live roster no longer includes the smoke-test model; pick a current ID explicitly.");
const answer = await provider.streamSimple(model, normalizeContext({ messages: [
  { role: "user", content: "Reply with exactly PI_FREE_OK", timestamp: Date.now() },
] }), { maxTokens: 512, signal: AbortSignal.timeout(90000) }).result();
assert.equal(answer.stopReason, "stop", answer.errorMessage);
assert.equal(answer.content.filter(b => b.type === "text").map(b => b.text).join("").trim(), "PI_FREE_OK");
assert.equal(answer.usage.cost.total, 0);
console.log(JSON.stringify({ verifiedAt: new Date().toISOString(), provider: provider.id, model: model.id,
  discovered: provider.getModels().length, stopReason: answer.stopReason, usage: answer.usage }, null, 2));
