import {
  anthropicMessagesApi, createProvider, envApiKeyAuth, openAICompletionsApi, openAIResponsesApi,
  type Api, type FetchFunction, type Model, type Provider, type ProviderStreams, type SimpleStreamOptions, type StreamOptions, type OpenAICompletionsOptions,
} from "@earendil-works/pi-ai/compat";
import { buildCatalog, LANES, type Lane } from "./catalog.ts";

export interface ProviderOptions { baseUrl?: string; fetch?: FetchFunction }

/** Gateway SSE occasionally arrives labelled application/json. Inspect bytes, not just headers. */
async function streamResponse(response: Response): Promise<Response> {
  if (!response.ok || !response.body || response.headers.get("content-type")?.includes("text/event-stream")) return response;
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0, done = false, isSse = false;
  const decoder = new TextDecoder();
  let prefix = "";
  while (bytes < 4096) {
    const part = await reader.read();
    if (part.done) { done = true; break; }
    chunks.push(part.value); bytes += part.value.length;
    prefix += decoder.decode(part.value, { stream: true });
    const trimmed = prefix.trimStart();
    if (/^(?:data:|event:|:)/.test(trimmed)) { isSse = true; break; }
    if (trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith("<")) break;
  }
  const headers = new Headers(response.headers);
  if (isSse) headers.set("content-type", "text/event-stream");
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (chunks.length) { controller.enqueue(chunks.shift()!); return; }
      if (done) { controller.close(); reader.releaseLock(); return; }
      try {
        const part = await reader.read();
        if (part.done) { done = true; controller.close(); reader.releaseLock(); }
        else controller.enqueue(part.value);
      } catch (error) { controller.error(error); reader.releaseLock(); }
    },
    cancel: reason => reader.cancel(reason),
  });
  return new Response(body, { status: response.status, statusText: response.statusText, headers });
}

export function createFreeProvider(lane: Lane, options: ProviderOptions = {}): Provider {
  const config = LANES[lane];
  const baseUrl = (options.baseUrl ?? config.baseUrl).replace(/\/+$/, "");
  const api = { "openai-completions": openAICompletionsApi(), "openai-responses": openAIResponsesApi(), "anthropic-messages": anthropicMessagesApi() };

  function prepare(model: Model<Api>, input: StreamOptions = {}): StreamOptions {
    const transport = input.fetch ?? options.fetch ?? globalThis.fetch;
    const fetch: FetchFunction = async (url, init) => {
      const request = new Request(url, init);
      const headers = new Headers(request.headers);
      if (lane === "kilo") headers.delete("authorization");
      headers.set("user-agent", "pi-our-free-model/0.1.0");
      const response = await transport(new Request(request, { headers, redirect: "error" }));
      return streamResponse(response);
    };
    return {
      ...input, fetch, maxRetries: 0,
      maxTokens: Math.min(input.maxTokens ?? 32768, model.maxTokens),
      apiKey: lane === "kilo" ? "keyless" : input.apiKey,
      onPayload: async (payload, selected) => {
        if (lane === "kilo" && model.reasoning) {
          const body = payload as Record<string, unknown>;
          const level = (input as SimpleStreamOptions).reasoning ?? (input as OpenAICompletionsOptions).reasoningEffort ?? "off";
          body.reasoning = level === "off" && model.thinkingLevelMap?.off !== null
            ? { enabled: false } : { effort: model.thinkingLevelMap?.[level] ?? "high" };
          delete body.reasoning_effort;
        }
        return await input.onPayload?.(payload, selected);
      },
    };
  }
  const streams: ProviderStreams = {
    stream: (model, context, input) => api[model.api as keyof typeof api].stream(model as never, context, prepare(model, input) as never),
    streamSimple: (model, context, input) => api[model.api as keyof typeof api].streamSimple(model as never, context, prepare(model, input)),
  };
  const provider: Provider = createProvider({
    id: config.id, name: config.name, baseUrl,
    auth: lane === "kilo" ? { apiKey: {
      name: "Public keyless pool",
      check: async () => ({ type: "api_key", source: "Public keyless pool" }),
      resolve: async () => ({ auth: { apiKey: "keyless" }, source: "Public keyless pool" }),
    } } : { apiKey: envApiKeyAuth("Authorized OpenCode API key", ["OPENCODE_API_KEY"]) },
    models: [], api: streams,
    fetchModels: async context => {
      const headers = new Headers({ accept: "application/json", "user-agent": "pi-our-free-model/0.1.0" });
      if (lane === "zen") {
        const key = context.credential?.type === "api_key" ? context.credential.key : undefined;
        const resolved = key ?? process.env.OPENCODE_API_KEY;
        if (!resolved) return provider.getModels();
        headers.set("authorization", `Bearer ${resolved}`);
      }
      const response = await (options.fetch ?? globalThis.fetch)(`${baseUrl}/models`, {
        headers, redirect: "error", signal: AbortSignal.any([context.signal, AbortSignal.timeout(15_000)]),
      });
      if (!response.ok) throw new Error(`${config.name}: catalog HTTP ${response.status}`);
      return buildCatalog(lane, await response.json(), baseUrl);
    },
  });
  const refresh = provider.refreshModels!;
  provider.refreshModels = context => refresh({ ...context, stored: context.stored ? {
    ...context.stored,
    models: context.stored.models.filter(model => model.provider === config.id && model.baseUrl === baseUrl &&
      ["openai-completions", "openai-responses", "anthropic-messages"].includes(model.api)),
  } : undefined });
  return provider;
}
