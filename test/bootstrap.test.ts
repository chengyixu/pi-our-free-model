import assert from "node:assert/strict";
import { test } from "node:test";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bootstrapProviders } from "../src/bootstrap.ts";

const row = { id: "poolside/laguna-xs-2.1:free", isFree: true, supported_parameters: ["tools"] };

test("bootstrap makes models available before Pi startup selection without mutating its cache", async () => {
  const root = await mkdtemp(join(tmpdir(), "ofm-bootstrap-"));
  try {
    const file = join(root, "models-store.json");
    const content = '{"unrelated":{"models":[]}}';
    await writeFile(file, content);
    const providers = await bootstrapProviders({ agentDir: root, offline: false,
      fetch: async () => new Response(JSON.stringify({ data: [row] })) });
    assert.equal(providers[0].getModels()[0].id, row.id);
    assert.equal(providers[1].getModels().length, 0);
    const { readFile } = await import("node:fs/promises");
    assert.equal(await readFile(file, "utf8"), content);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("offline bootstrap and corrupt cache never contact the network or break extension loading", async () => {
  const root = await mkdtemp(join(tmpdir(), "ofm-bootstrap-"));
  try {
    await writeFile(join(root, "models-store.json"), "not json");
    let hits = 0;
    const providers = await bootstrapProviders({ agentDir: root, offline: true,
      fetch: async () => { hits++; throw new Error("unexpected network"); } });
    assert.equal(providers.length, 2);
    assert.equal(hits, 0);
    assert.equal(providers[0].getModels().length, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});
