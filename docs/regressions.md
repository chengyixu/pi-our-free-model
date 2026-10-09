# Regression boundaries

| ID | Failure | Standing proof |
| --- | --- | --- |
| OFM-001 | Wrong SSE Content-Type loses a real answer | provider.test.ts: one-byte UTF-8 stream labelled JSON |
| OFM-002 | Pi module aliases make subpath imports unloadable | cli.test.ts: actual package factory loads in real Pi |
| OFM-003 | Public-pool sentinel is sent as a credential | provider.test.ts / cli.test.ts: Authorization absent |
| OFM-004 | Failed or stale catalog publication empties live models | provider.test.ts: 429 retention and rejected publication |
| OFM-005 | Offline startup sends discovery I/O | bootstrap.test.ts / cli.test.ts: offline restore |
| OFM-006 | Print command report disappears or contaminates protocol | cli.test.ts: privacy content on stderr without inference |

Only local fixture tests run automatically. Live upstream health is deliberately opt-in and is not inferred from hermetic tests.
