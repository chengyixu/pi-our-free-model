import type { Api, Model, OpenAICompletionsCompat } from "@earendil-works/pi-ai";
import { getBuiltinModels } from "@earendil-works/pi-ai/providers/all";

export type Lane = "kilo" | "zen";
export const LANES = {
  kilo: { id: "ofm-kilo", name: "Our Free Model · Kilo", baseUrl: "https://api.kilo.ai/api/gateway" },
  zen: { id: "ofm-zen", name: "Our Free Model · OpenCode (authorized key)", baseUrl: "https://opencode.ai/zen/v1" },
} as const;

const ZERO_COST = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 };
const zenModels = new Map<string, Model<Api>>(getBuiltinModels("opencode").map(model => [model.id, model]));
const compat: OpenAICompletionsCompat = {
  maxTokensField: "max_tokens", supportsStore: false, supportsDeveloperRole: false,
  supportsReasoningEffort: false, supportsStrictMode: false,
};

function positive(value: unknown, otherwise: number): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 2 ? Math.floor(value) : otherwise;
}
function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

/** Only upstream-declared free chat models. Never invent access to paid models. */
export function buildCatalog(lane: Lane, payload: unknown, baseUrl: string = LANES[lane].baseUrl): Model<Api>[] {
  const data = record(payload).data;
  if (!Array.isArray(data)) throw new Error(`${LANES[lane].name}: malformed model catalog`);
  const seen = new Set<string>();
  const models: Model<Api>[] = [];
  for (const raw of data) {
    const row = record(raw);
    if (typeof row.id !== "string" || !row.id.trim()) continue;
    const id = row.id.trim();
    // No Gemini integration; Jev is a classifier, not a chat model.
    if (seen.has(id) || /(?:^|\/)google\/|gemini|^jev-/i.test(id)) continue;
    const parameters = Array.isArray(row.supported_parameters) ? row.supported_parameters : [];
    if (lane === "kilo" ? row.isFree !== true || !parameters.includes("tools") : !/(?:^|[-_])free(?:$|[-_.])/.test(id)) continue;
    seen.add(id);
    const known = lane === "zen" ? zenModels.get(id) : undefined;
    const contextWindow = positive(row.context_length, known?.contextWindow ?? 131072);
    const maxTokens = Math.min(positive(record(row.top_provider).max_completion_tokens, known?.maxTokens ?? 32768), contextWindow - 1);
    const input = Array.isArray(record(row.architecture).input_modalities) ? record(row.architecture).input_modalities as unknown[] : [];
    const mandatory = /^(stepfun|liquid|thinkingmachines)\//.test(id) || ["kilo-auto/free", "openrouter/free"].includes(id);
    const reasoning = lane === "kilo" ? parameters.includes("reasoning") : known?.reasoning ?? true;
    const name = typeof row.name === "string" ? row.name.replace(/^[^:]{1,40}:\s+/, "").replace(/\s*\(free\)\s*$/i, "").trim() : known?.name ?? id;
    models.push({
      ...known, id, name, provider: LANES[lane].id, baseUrl,
      api: known?.api ?? "openai-completions", cost: { ...ZERO_COST },
      contextWindow, maxTokens, reasoning,
      input: lane === "zen" ? known?.input ?? ["text"] : input.includes("image") ? ["text", "image"] : ["text"],
      thinkingLevelMap: lane === "kilo" ? {
        off: mandatory ? null : "none", minimal: "low", low: "low", medium: "medium", high: "high", xhigh: "high", max: "high",
      } : known?.thinkingLevelMap,
      compat: known?.compat ?? { ...compat },
    });
  }
  if (!models.length) throw new Error(`${LANES[lane].name}: no free agent models in catalog`);
  return models;
}
