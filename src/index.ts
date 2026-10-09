import { getAgentDir, type ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { bootstrapProviders } from "./bootstrap.ts";
import { LANES } from "./catalog.ts";

const PRIVACY = "Prompts, tool results and images go directly to the chosen upstream. Kilo free-pool prompts may be logged or used for training. Do not send secrets or sensitive code. Free tiers have rate limits and can change. OpenCode requires your own authorized API key; this plugin does not bypass its client gate.";
const HELP = "Commands: /free-models · /free-models list · /free-models refresh · /free-models use <exact-model-id> · /free-models privacy. Use Pi's /model, /thinking and /session for selection, reasoning and usage.";

export default async function (pi: ExtensionAPI) {
  const offline = ["1", "true"].includes(process.env.PI_OFFLINE ?? "") || process.argv.includes("--offline");
  const bootErrors: string[] = [];
  for (const provider of await bootstrapProviders({ agentDir: getAgentDir(), offline,
    onError: (lane, error) => bootErrors.push(`${LANES[lane].name}: ${error instanceof Error ? error.message : String(error)}`),
  })) pi.registerProvider(provider);

  pi.on("session_start", async (_event, ctx) => {
    // Persist discovery through Pi's transactional store, not an extension-owned writer.
    const result = await ctx.modelRegistry.refresh({ providers: [LANES.kilo.id, LANES.zen.id], allowNetwork: !offline });
    if (ctx.hasUI) {
      const errors = [...bootErrors, ...[...result.errors.values()].map(error => error.message)];
      if (errors.length) ctx.ui.notify(`Free model discovery: ${errors.join("; ")}. Run /free-models refresh to retry.`, "warning");
      ctx.ui.notify("Our Free Model: /free-models to pick a model. Public pool may log prompts; /free-models privacy before sensitive work.", "info");
    }
  });

  pi.registerCommand("free-models", {
    description: "Browse public free models, refresh discovery or read privacy notes",
    handler: async (args, ctx) => {
      const [action = "", ...rest] = args.trim().split(/\s+/);
      function output(text: string, error = false) {
        if (ctx.mode === "print") console.log(text);
        else if (ctx.hasUI) ctx.ui.notify(text, error ? "warning" : "info");
        else pi.sendMessage({ customType: "free-models", content: text, display: true }, { triggerTurn: false });
      }
      if (action === "privacy") { output(PRIVACY); return; }
      if (action === "refresh") {
        if (offline) { output("Offline mode: discovery is disabled. Restart without --offline to refresh.", true); return; }
        const result = await ctx.modelRegistry.refresh({ providers: [LANES.kilo.id, LANES.zen.id], allowNetwork: true, force: true });
        output(result.errors.size ? `Refresh failed: ${[...result.errors.values()].map(error => error.message).join("; ")}. Last successful catalog retained.` : "Free model catalog refreshed.", result.errors.size > 0);
        return;
      }
      const models = ctx.modelRegistry.getAvailable().filter(model => [LANES.kilo.id, LANES.zen.id].includes(model.provider as typeof LANES.kilo.id));
      if (action === "list") {
        output(models.length ? models.map(model => `${model.provider}/${model.id} · ${model.contextWindow.toLocaleString()} context${model.input.includes("image") ? " · vision" : ""}`).join("\n") : "No catalog available. Run /free-models refresh when online.");
        return;
      }
      if (action === "use") {
        const id = rest.join(" ");
        const matches = models.filter(model => model.id === id || `${model.provider}/${model.id}` === id);
        if (matches.length !== 1) { output("Use an exact, unambiguous ID from /free-models list.", true); return; }
        output(await pi.setModel(matches[0]) ? `Selected ${matches[0].name}.` : "The model could not be selected.");
        return;
      }
      if (action) { output(HELP, true); return; }
      if (!models.length || !ctx.hasUI) { output(`${HELP}\n${models.length ? `${models.length} models available.` : "No catalog available. Refresh when online."}`); return; }
      const labels = models.map(model => `${model.name} — ${model.provider}/${model.id}`);
      const selected = await ctx.ui.select("Our Free Model · public pool (prompts may be logged)", labels);
      if (selected) await pi.setModel(models[labels.indexOf(selected)]);
    },
  });
}
