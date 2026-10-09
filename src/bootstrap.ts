import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { FetchFunction, ModelsStoreEntry, Provider } from "@earendil-works/pi-ai";
import { LANES, type Lane } from "./catalog.ts";
import { createFreeProvider } from "./provider.ts";

export interface BootstrapOptions {
  agentDir: string; offline: boolean; fetch?: FetchFunction;
  onError?: (lane: Lane, error: unknown) => void;
}

/** Read only: Pi's locked ModelsStore is the sole writer of persistent catalogs. */
export async function bootstrapProviders(options: BootstrapOptions): Promise<Provider[]> {
  let cache: Record<string, ModelsStoreEntry> = {};
  try {
    const parsed: unknown = JSON.parse(await readFile(join(options.agentDir, "models-store.json"), "utf8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) cache = parsed as typeof cache;
  } catch { /* Missing/corrupt cache: discover live or leave the provider empty offline. */ }
  return Promise.all((["kilo", "zen"] as const).map(async lane => {
    const provider = createFreeProvider(lane, { fetch: options.fetch });
    const stored = cache[LANES[lane].id];
    try {
      await provider.refreshModels!({
        stored: stored && Array.isArray(stored.models) ? stored : undefined,
        allowNetwork: !options.offline, signal: AbortSignal.timeout(15_000),
        publish: async p => { p.update?.(); return true; },
      });
    } catch (error) { options.onError?.(lane, error); }
    return provider;
  }));
}
