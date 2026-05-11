# `@phosra/sdk` — TypeScript SDK for PCSS

> **Status: 0.x scaffolding · v1.0 public review.** Published as a four-package npm workspace tracking [PCSS v1.0](../v1/pcss-v1.0.md). Versions in `0.x` until the spec ratifies and we cut `1.0.0`.

This workspace publishes the reference TypeScript SDK for the Phosra Child Safety Specification. Adopters consume PCSS by installing these packages from npm.

## Packages

| Package | Purpose | Browser? | Runtime deps |
| --- | --- | --- | --- |
| [`@phosra/types`](packages/types/) | TypeScript types matching the v1.0 JSON Schemas | yes (zero runtime) | none |
| [`@phosra/sdk`](packages/sdk/) | Client + server helpers (`PhosraClient`, `lensEvaluate`, `notarySign/Verify`, `canonicalize`) | yes (sdk/browser subpath) | `@phosra/types`, `@noble/ed25519` |
| [`@phosra/conformance`](packages/conformance/) | Conformance test runner against any PCSS endpoint | no | `@phosra/types`, `@phosra/sdk`, `ajv` |
| [`@phosra/cli`](packages/cli/) | CLI: `phosra verify`, `phosra conformance run`, `phosra types generate` | no | `@phosra/sdk`, `@phosra/conformance` |

## Quickstart

```bash
npm install @phosra/sdk @phosra/types
```

```ts
import { phosra } from "@phosra/sdk"

// Identify a Bearing (age signal)
const bearing = await phosra.bearing.identify({
  subject: { account_id: "demo-11yo" },
  jurisdiction: "US-CA",
})

// Evaluate against the rule registry
const verdict = await phosra.lens.evaluate({
  bearing,
  surface: "feed-rank",
  capability: "recommender",
  jurisdiction: "US-CA",
})

console.log(verdict.allow, verdict.reason)
// → false  "lens:recommender_off_minor"

// Sign the verdict for regulator replay
const receipt = await phosra.notary.sign({ verdict })

// Anyone (FTC, civil-society auditor, you) can verify it later
const { valid, replays } = await phosra.notary.verify({ receipt })
```

## Server-side helpers (no network)

For implementers running their own Lens evaluator:

```ts
import {
  canonicalize, lensEvaluate, notarySign, notaryVerify,
} from "@phosra/sdk/server"

const verdict = lensEvaluate({
  bearing,
  surface: "feed-rank",
  capability: "recommender",
  jurisdiction: "US-CA",
  rules: await fetchRuleRegistry(),
})

const receipt = notarySign(verdict, { keyId, privateKey })
```

## Build / publish

The workspace uses **pnpm** (or npm 7+ workspaces) and ships dual ESM+CJS via `tsup`. Node 20+ is the runtime floor. Browser builds for `@phosra/types` and `@phosra/sdk/browser` ship without `node:crypto` dependencies.

```bash
pnpm install
pnpm -r build
pnpm -r test
```

Releases are coordinated via [changesets](https://github.com/changesets/changesets). The first cut of `1.0.0` happens when PCSS v1.0 ratifies (target Q3 2026 per [ROADMAP.md](../ROADMAP.md)). Before then the SDK ships as `0.x` so we can iterate.

## Versioning

SDK major version tracks spec major: `@phosra/sdk@1.x` implements PCSS v1.x. `@phosra/types@1.0.0` is locked to `PCSS-v1.0`. Receipts emit `spec: "PCSS-v1.0"` and the SDK refuses to verify receipts whose `spec` exceeds its known major version.

## Type generation

Types in `@phosra/types/src/generated/` are generated from `../v1/schema/*.json` via a build script. The generated files carry the schema's sha256 in their header; CI fails if the lockfile mismatches a regenerate. To regenerate:

```bash
pnpm -F @phosra/types generate
```

## Status against the spec

| PCSS capability | SDK coverage | Notes |
| --- | --- | --- |
| Bearing (§3) | ✅ `phosra.bearing.identify` + types | |
| Lens (§4) | ✅ `phosra.lens.evaluate` + `lensEvaluate` server helper | |
| Threshold (§5) | ✅ `phosra.threshold.check` + types | |
| Aegis (§6) | ✅ `phosra.aegis.check` + types | |
| Herald (§7) | 🟡 types only; subscription API in v0.2 | |
| Custody (§8) | 🟡 types only; `phosra.custody.delete` in v0.2 | |
| Verdict (§9) | ✅ shared type, emitted by Lens/Threshold/Aegis | |
| Notary (§10) | ✅ `phosra.notary.sign` + `verify` + server `notarySign` | |

## License

MIT for all packages. PCSS spec itself is CC BY 4.0; the SDK code permissively-licensed so adopters can copy/fork freely.
