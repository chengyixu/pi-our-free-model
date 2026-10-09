# ADR 0001: native provider integration instead of DSH emulation

Status: accepted for 0.1.0.

The source product has web dashboards, account integrations, anonymous client fingerprints and self-managed updates. Pi already owns distribution, auth, sessions and API parsing. Wrapping the DSH runtime would duplicate those owners and expose extra servers/state.

Decision: implement native Provider objects; use Kilo's public free pool; require authorized credentials for Zen rather than impersonating OpenCode. Share Pi's typed APIs and metadata. Keep original convention research credited. No DSH runtime/vendor bundle is copied.

Consequences: simple install, no daemon or account pool, robust Pi tool integration, and less feature parity. Availability/privacy remain upstream properties. The marketing explicitly names this limitation. Prefer a new native boundary only after a concrete user requirement and a reproducible test.
