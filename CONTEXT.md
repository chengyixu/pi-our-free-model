# Maintainer context

Small Pi 1.1.0 provider extension; Node 22.19+; no build step or runtime packages beyond Pi peers. The upstream DSH project was researched on 2026-10-10; the Pi port intentionally includes public Kilo and authorized-key Zen only.

Pi owns credentials, sessions, package updates and the locked `models-store.json`. The extension has no servers, background timers, telemetry or self-writer. Discovery performs network I/O, never test inference. Treat catalog metadata as upstream claims, not verified availability.

Important invariants: no fake OpenCode identity or tools, no EAC secrets, no account pools, no Gemini integrations; no Authorization sent to Kilo; no automatic SDK replay; preserve Pi instrumentation and signal. Tests own the external boundary, never replace production API parsers.

Commands: `npm ci --ignore-scripts`; `npm run check`; `pi -e .`. Live smoke is explicitly opt-in (`npm run test:live`). Release via GitHub PR, passing CI, main merge, annotated tag and GitHub release. Installation is Git-based; npm publication is not claimed.
