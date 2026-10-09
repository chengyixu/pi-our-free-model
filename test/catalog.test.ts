import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCatalog } from "../src/catalog.ts";

const kiloRow = {
  id: "poolside/laguna-xs-2.1:free", name: "Poolside: Laguna XS 2.1 (free)", isFree: true,
  context_length: 262144, top_provider: { max_completion_tokens: 32768 },
  architecture: { input_modalities: ["text"] }, supported_parameters: ["tools", "reasoning"],
};

test("Kilo discovers only explicitly free agent-capable models, never paid or moderation-only rows", () => {
  const models = buildCatalog("kilo", { data: [kiloRow, kiloRow,
    { ...kiloRow, id: "paid-model", isFree: false },
    { ...kiloRow, id: "unpriced-model", isFree: undefined },
    { ...kiloRow, id: "moderation:free", supported_parameters: ["reasoning"] },
    { ...kiloRow, id: "google/gemini-test:free" }, { id: "" }, null] });
  assert.deepEqual(models.map(m => m.id), ["poolside/laguna-xs-2.1:free"]);
  assert.equal(models[0].provider, "ofm-kilo");
  assert.equal(models[0].contextWindow, 262144);
  assert.equal(models[0].maxTokens, 32768);
  assert.deepEqual(models[0].input, ["text"]);
  assert.equal(models[0].cost.input, 0);
});

test("Kilo trusts declared vision and omits unsupported thinking-off choices", () => {
  const [model] = buildCatalog("kilo", { data: [{ ...kiloRow,
    id: "stepfun/step-5-preview-free", architecture: { input_modalities: ["text", "image"] } }] });
  assert.deepEqual(model.input, ["text", "image"]);
  assert.equal(model.thinkingLevelMap?.off, null);
  assert.equal(model.thinkingLevelMap?.max, "high");
});

test("unusable limits are conservative, finite and bounded by context", () => {
  const [model] = buildCatalog("kilo", { data: [{ ...kiloRow, context_length: -1,
    top_provider: { max_completion_tokens: Infinity } }] });
  assert.equal(model.contextWindow, 131072);
  assert.equal(model.maxTokens, 32768);
  const [small] = buildCatalog("kilo", { data: [{ ...kiloRow, context_length: 2048 }] });
  assert.ok(small.maxTokens < small.contextWindow);
});

test("Zen filters classifiers and paid ids, and uses Pi's declared API metadata", () => {
  const models = buildCatalog("zen", { data: [{ id: "gpt-6-sol" }, { id: "jev-1.13-free" },
    { id: "gemini-test-free" }, { id: "muse-spark-1.3-contributor-free" },
    { id: "mimo-v2.6-flash-free" }, { id: "new-model-free" }] });
  assert.deepEqual(models.map(m => m.id), ["muse-spark-1.3-contributor-free", "mimo-v2.6-flash-free", "new-model-free"]);
  assert.equal(models[0].api, "openai-responses");
  assert.equal(models[1].api, "openai-completions");
  assert.deepEqual(models[2].input, ["text"]);
});

for (const bad of [{}, { data: "wrong" }, { data: [] }]) {
  test(`malformed or empty discovery does not silently wipe the last catalog: ${JSON.stringify(bad)}`, () => {
    assert.throws(() => buildCatalog("kilo", bad), /catalog|models/i);
  });
}
