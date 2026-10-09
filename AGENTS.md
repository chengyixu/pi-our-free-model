# Pi Our Free Model

Read CONTEXT.md and docs/architecture.md before changing code. Keep this integration small and depend on Pi's public provider/streaming contracts. Do not write a second session store, updater, SSE parser, model capability table or account pool.

`npm run check` is the release gate. Tests are hermetic and exercise actual Pi CLI/API implementations over local HTTP fixtures. Add a failing boundary test before fixing a regression. Never automatically run `test:live` in CI; it consumes upstream allowance.

Always retain honest upstream names/privacy warnings. Never claim unlimited/private or full DSH feature parity. Do not add client impersonation, fake tool declarations, sealed credentials, Gemini integration or automatic provider switching.

Marketing sources live in scripts/render-assets.mjs and docs/assets. Label illustrations as illustrations, not screenshots. Update package/docs/tag together. Host packages stay peerDependencies with '*', not runtime dependencies.
