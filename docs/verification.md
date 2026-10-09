# Verification record — 0.1.0

Recorded 2026-10-10 in the development environment (Node 24.11.1, Pi 1.1.0). Live availability is a point-in-time observation, not a future guarantee.

## Live upstream, real Pi CLI

A temporary, isolated Pi agent directory was used. No account key was supplied, other extensions/skills/context files were disabled, and Kilo received an explicitly Pi-identifying User-Agent.

```sh
PI_CODING_AGENT_DIR=<temporary-directory> OPENCODE_API_KEY= \
  pi -ne -ns -np -nc -na --no-session -e . --list-models ofm-kilo
```

Result: **15 public, tool-capable Kilo models**. Moderation-only and paid catalog entries were excluded.

```sh
PI_CODING_AGENT_DIR=<temporary-directory> OPENCODE_API_KEY= \
  pi -ne -ns -np -nc -na --no-session -e . \
  --model 'ofm-kilo/poolside/laguna-xs-2.1:free' \
  --thinking off --no-tools --print 'Reply with exactly PI_NATIVE_OK'
```

Output:

```text
PI_NATIVE_OK
```

A separate direct Kilo request returned `PI_FREE_OK`, `finish_reason: stop`, 54 total tokens and zero cost. A direct anonymous Pi-identifying Zen request returned `FreeTierError` (“can only be used from within OpenCode”). That refusal is why no spoofing/free-tier fingerprint route is implemented.

## Automated boundary tests

`npm run check` typechecks against actual Pi 1.1.0 declarations, runs hermetic tests, and verifies the distributable package/PNG signatures.

- Free-only/tool-capable discovery; classifiers, Gemini and paid rows excluded.
- Conservative limits, declared vision, mandatory-thinking menus, API mapping.
- Persisted refresh publication, stale-generation rejection, endpoint validation, offline loading and corrupt caches.
- Real HTTP/SSE with wrong Content-Type, one-byte UTF-8 chunks, usage, thinking and request instrumentation.
- Tool-call → parsed arguments → tool-result → final answer over the real Pi API implementation.
- Aborts, truncated partial streams and quota failures, with one physical request and no hidden SDK replay.
- Real Pi CLI package loading, startup model selection, persisted catalog, offline restart and privacy command without inference.

Fixture text is never presented as live-provider evidence. `npm test` rejects external network in the CLI fixture; other provider tests inject local HTTP URLs.

## Not claimed

Every listed model's live availability, vision accuracy, region reachability, long reasoning output or reliability is **not** individually verified. Authorized Zen inference has no live account acceptance. DSH UI/account channels/EAC are not part of this product. Visual walkthrough is an illustration, not a screenshot. Upstream logging policy is a disclosure, not a privacy audit.

The optional `npm run test:live` is a reproducible Kilo smoke test and consumes free allowance. It is not run on a schedule or in CI.
