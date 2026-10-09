import assert from "node:assert/strict";
import { test } from "node:test";
import type { ModelsStoreEntry } from "@earendil-works/pi-ai";
import { createFreeProvider } from "../src/provider.ts";

test("a stored catalog cannot defer refresh forever by resetting its checkedAt without discovery", async () => {
  let hits = 0;
  const provider = createFreeProvider("kilo", { fetch: async () => {
    hits++;
    return new Response(JSON.stringify({ data: [{ id: `model-${hits}:free`, isFree: true, supported_parameters: ["tools"] }] }));
  } });
  let stored: ModelsStoreEntry | undefined;
  const context = () => ({ allowNetwork: true, signal: new AbortController().signal, stored,
    publish: async (p: { persist?: ModelsStoreEntry | null; update?: () => void }) => { if (p.persist) stored = p.persist; p.update?.(); return true; } });
  await provider.refreshModels!(context());
  await provider.refreshModels!(context());
  assert.equal(hits, 2, "each online refresh checks upstream rather than perpetually extending a stale TTL");
  assert.deepEqual(provider.getModels().map(m => m.id), ["model-2:free"]);
});
