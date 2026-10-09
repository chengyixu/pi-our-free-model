# Sector: free-model-provider

Purpose: one Pi provider bounded context, four small modules. catalog → provider → bootstrap → extension is the dependency direction. Schemas come from Pi's Model/Provider/TranscriptContext contracts and upstream metadata.

Invariants: only explicitly free tool-capable Kilo rows; no anonymous Zen spoofing; no fake tools; no Kilo Authorization; delegate parsers to Pi; preserve hooks/signals; Pi alone writes its cache. Tests live in ../test and include actual CLI/HTTP boundary coverage. See ../CONTEXT.md for environment and ../docs/architecture.md for design intent.
