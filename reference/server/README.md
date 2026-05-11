# PCSS Reference Server

> **Status:** v0.1 scaffold · MIT-licensed · target host `reference.pcss.dev` (TBA per [ROADMAP.md](../../ROADMAP.md) H1.7).

A working, minimal-but-complete implementation of the PCSS v1.0 OpenAPI surface. **Not** Phosra Inc.'s production backend — this is the pedagogical reference that adopters target during development and that the conformance suite runs against as the gold standard.

## What it does

Implements every operation in [`v1/openapi.yaml`](../../v1/openapi.yaml):

| Operation | Endpoint | Status |
| --- | --- | --- |
| Bearing | `POST /bearing/identify` | ✅ |
| Lens | `POST /lens/evaluate` | ✅ |
| Threshold | `POST /threshold/check` | ✅ |
| Aegis | `POST /aegis/check` | ✅ |
| Notary | `POST /notary/sign` | ✅ |
| Notary | `POST /notary/verify` | ✅ |
| Registry | `GET /registry/rules` | ✅ |
| Herald | `POST /herald/notify` | 🟡 v0.2 |
| Custody | `POST /custody/delete` | 🟡 v0.2 |

Rule registry: loads from [`../../v1/rules/*.json`](../../v1/rules/) at startup. Storage: in-memory by default; `--storage=postgres` opt-in via env var.

## Run it

```bash
cd reference/server
pnpm install
pnpm dev   # http://localhost:7474
```

Or via Docker:

```bash
docker build -t pcss-reference-server .
docker run -p 7474:7474 pcss-reference-server
```

## Point the SDK at it

```ts
import { PhosraClient } from "@phosra/sdk"
const phosra = new PhosraClient({ baseUrl: "http://localhost:7474/v1" })

const bearing = await phosra.bearing.identify({
  subject: { account_id: "demo-11yo" },
  jurisdiction: "US-CA",
})
const verdict = await phosra.lens.evaluate({
  bearing,
  surface: "feed-rank",
  capability: "recommender",
  jurisdiction: "US-CA",
})
console.log(verdict.allow, verdict.reason)
// → false  "lens:recommender_off_minor"
```

## Architecture

```
Fastify (HTTP)
   │
   ├── routes/ — one file per OpenAPI path
   │     bearing.ts → /bearing/identify
   │     lens.ts    → /lens/evaluate     ──► @phosra/sdk/server lensEvaluate()
   │     notary.ts  → /notary/sign|verify ──► @phosra/sdk/server notarySign|Verify()
   │     ...
   │
   ├── store/ — Store interface + impls
   │     memory.ts (default)
   │     postgres.ts (opt-in)
   │
   ├── rules/ — loads ../../v1/rules/*.json at startup
   │
   └── key/ — ed25519 key for Notary signing
         generated on first run; written to ./.pcss-reference-key.json (gitignored)
         public key published to v1/registry/keys/reference.json
```

## Why TypeScript

- The published SDK is `@phosra/sdk` (TypeScript); adopters reading the docs already have a TS toolchain.
- `examples/typescript/implementer.ts` is already ~80% of this server.
- The most readable reference code for non-Phosra engineers evaluating the spec.

Phosra's production backend (Go) remains an *implementation* of the spec — the TS server here is the *reference*. The two are separate; tests use this server, audits use this server, conformance runs against this server.

## Key material

On first run the server generates an ed25519 keypair, writes the private key to `./.pcss-reference-key.json` (gitignored), and prints the public key + key_id to stdout. The public key is published in the spec repo at `v1/registry/keys/reference.json` so verifiers can resolve it offline.

**Do not deploy with a shared private key.** If you fork this for your own reference, regenerate.

## License

MIT. Fork freely. The point of this server is to be a working starting point — copy whatever helps.
