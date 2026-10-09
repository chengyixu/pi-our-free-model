# Architecture

```text
src/catalog.ts    upstream metadata → validated Pi chat models
        ↑
src/provider.ts   discovery + native auth + Pi API delegation
        ↑
src/bootstrap.ts  read-only startup catalog restoration/discovery
        ↑
src/index.ts      Pi registration, lifecycle and /free-models UX
```

One small provider integration is the bounded context. Splitting each file into a directory would add navigation cost without another ownership boundary.

## Provider ownership

`ofm-kilo` is intrinsically keyless. It resolves an internal non-secret sentinel so Pi can list the models; the request transport removes Authorization entirely. No sentinel is sent. `ofm-zen` resolves an authorized API key via Pi's native authentication, with no pooled key or impersonated client.

`createProvider` owns the synchronous model view and transactional refresh. Discovery returns full metadata. Pi's generation-checked `publish` updates catalog state and persists through Pi's locked store. Failed discovery cannot replace the last good list. The provider validates persisted provider IDs/endpoints before restoration.

The async extension factory reads a snapshot of `models-store.json` and discovers live models before initial CLI selection. It never writes that file. `session_start` asks Pi to refresh and persist. Offline loading restores only cached metadata. There are no extension-owned timers, workers or sockets to clean up.

## Streaming boundary

Pi's own Completions, Responses and Anthropic API implementations own transcript conversion, event normalization, usage and cancellation. The adapter only:

1. selects upstream transport and honest User-Agent;
2. strips keyless Authorization and refuses redirects;
3. injects Kilo's declared reasoning field;
4. detects SSE hidden behind an incorrect Content-Type without discarding initial bytes;
5. disables SDK retries so the same partial request is not replayed invisibly.

Request payload, response and raw-event instrumentation are forwarded. Pi's higher-level retry policy is separate and can still retry when configured.

## Trade-offs

Catalog presence is not reachability. The extension deliberately does not auto-probe every model, spend free allowance in the background, guess geographical availability, or hide a rate-limited model. Capabilities are upstream claims; unknown vision stays text-only. Unknown limits use conservative metadata defaults, not fabricated larger contexts. Known Zen model APIs come from Pi's catalog instead of a second hand-maintained table.

No in-app self-updater or gateway: Pi already owns distribution, sessions and usage. This prevents two writers to installed bytes, port conflicts and credential-bearing local HTTP surfaces.
