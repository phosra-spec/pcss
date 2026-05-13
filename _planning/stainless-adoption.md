# Stainless adoption plan

> **Status:** Config + workflow scaffolded 2026-05-13. Adoption is partial — see [`audit-2026-05-12.md`](audit-2026-05-12.md) item #11 for the analysis.

## What's in place

- `openapi.stainless.yml` at repo root — namespace mapping, shared model promotion, four-language target matrix.
- `.github/workflows/stainless-conformance.yml` — conformance-gate scaffold (currently triggered on spec changes only; switch to `repository_dispatch` once the Stainless GitHub App is connected).
- Hand-written packages staying in place: `@phosra/conformance`, `@phosra/cli`, the `reference/server/`, and any future `@phosra/server` or `@phosra/canonical` carrying RFC 8785 JCS + ed25519 helpers.

## Adopter actions on the Stainless side

1. **Connect the spec repo.** In the Stainless dashboard → New project → connect `phosra-spec/pcss`. Stainless will detect `openapi.stainless.yml` at the repo root automatically.
2. **Apply for the OSS Starter discount.** PCSS is non-commercial open spec (CC BY 4.0). Email Stainless support after signup; reference the spec license and the public-review status.
3. **Decide on the four target repos.** Either let Stainless create them under `phosra-spec/`:
   - `phosra-spec/pcss-sdk-node`
   - `phosra-spec/pcss-sdk-python`
   - `phosra-spec/pcss-sdk-go`
   - `phosra-spec/pcss-sdk-kotlin`
   ...or change the `production_repo` paths in `openapi.stainless.yml`.
4. **Install the Stainless GitHub App** on the spec repo + each downstream SDK repo. Stainless watches `v1/openapi.yaml` for changes and opens PRs.
5. **First-cut review.** Inspect the generated TS SDK before merging; confirm:
   - `client.lens.evaluate(...)` namespace matches the existing `@phosra/sdk` shape so adopters don't refactor.
   - `Bearing` / `Verdict` / `Receipt` / `Rule` model names match.
   - Auth shape (`PHOSRA_API_KEY` env, `Authorization: Bearer` header) is what you want.
6. **Conformance gate.** Run `@phosra/conformance` against the generated SDK pointed at the reference server. Vectors must pass before publishing.

## What does NOT change

- `v1/openapi.yaml`, `v1/schema/*.json`, `v1/rules/*.json`, `v1/conformance/*` — sovereign, unchanged.
- The spec itself (`v1/pcss-v1.0.md`, capabilities, governance) — Stainless never touches these.
- The reference server at `reference/server/` — Stainless generates clients, not servers.
- The conformance suite at `sdk-typescript/packages/conformance/` and the CLI at `sdk-typescript/packages/cli/` — hand-written; consume the generated SDK as a dependency.

## Deprecation path for the hand-written `@phosra/sdk`

1. Stainless ships first generated TS SDK on a separate branch / prerelease (`@phosra/sdk@0.2.0-stainless.1`).
2. Run conformance vectors — green.
3. Cut the next minor of `@phosra/sdk` as the Stainless build. Replace `sdk-typescript/packages/sdk/` with a thin re-export package if needed for backward-compat, or delete entirely.
4. Move any server-side helpers (`canonicalize`, `lensEvaluate`, `notarySign`, `notaryVerify`, `lens.ts`) into a new package `@phosra/server` (or fold into `@phosra/canonical` if the canonicalization concern dominates).
5. Update the [SDK README](../sdk-typescript/README.md) to point at the generated source.

## Things that will need maintainer attention

- **RFC 8785 JCS canonicalization** stays out of generated code. The current `canonicalize.ts` in `@phosra/sdk/server` must survive the migration — move it to `@phosra/server` or `@phosra/canonical`.
- **CLI generation** is advertised by Stainless but not deeply documented. Validate against a live customer CLI before depending on it; until then keep `@phosra/cli` hand-written.
- **Free-tier language gating** isn't public on Stainless's pricing page. Confirm that all four languages (TS, Python, Go, Kotlin) are available before counting on the matrix.
- **Vendor lock-in posture.** Generated SDKs ship under MIT/Apache by precedent (Anthropic's TS SDK = MIT, OpenAI's Go SDK = Apache-2.0). If Stainless changes terms, fork the last generated build — it's normal forkable code.

## Effort

1.0–1.5 engineer-weeks if approvals + DNS + repo creation flow smoothly. Most of the time is review of the first cut, not coding.

## Open questions

- Whether the OSS Starter discount applies to all four language targets simultaneously.
- Whether CLI generation works against this OpenAPI shape (no Stainless customer CLI is publicly available to study at fetch time).
- Whether `propertyNames.pattern` on the PII-blocklist `extensions` blocks survives OpenAPI 3.1 → Stainless model emission (Stainless docs note `propertyNames` is unsupported; the generated TS types may drop the constraint, which is OK because the conformance suite enforces it at the wire layer).
