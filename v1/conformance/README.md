# PCSS Conformance Test Suite — v1.0

> **Status:** v0.1 fixtures + runner scaffold. Full Tier-0 suite ships per [ROADMAP.md](../../ROADMAP.md) H1.1 (target 2026-06-15).

A PCSS-conformant implementation passes the tests in this directory against its live HTTP endpoint. The suite is protocol-shaped: it speaks only the OpenAPI surface in [`../openapi.yaml`](../openapi.yaml) and validates against the JSON Schemas in [`../schema/`](../schema/). Nothing here knows about Phosra's reference implementation.

## Running

```bash
npx @phosra/conformance \
  --endpoint=https://my-impl.example.com/pcss/v1 \
  --tier=1 \
  --implementer=platform:example
```

Two runners exist; both consume the same fixture set:

- **`@phosra/conformance`** (npm) — TypeScript, the default. Runs on Node 20+, Bun, and Deno.
- **`github.com/phosra-spec/pcss-conformance`** (Go module) — for adopters with Go-native CI.

## Tiered conformance

| Tier | Required suites | Endpoints exercised |
| --- | --- | --- |
| **Tier-0 Implementer** | Schema, Semantics (cases 1–4) | `/bearing/identify`, `/lens/evaluate`, `/notary/sign` |
| **Tier-1 Adopter** | Tier-0 + Semantics (all 8), Replay (1–7), Negative (all 8) | Above + `/threshold/check`, `/aegis/check`, `/notary/verify` |
| **Tier-2 Custodian** | Tier-1 + Replay 8 (strict byte-equal), Privacy (all 7), Herald + Custody live tests | Above + `/registry/rules`, Herald subscriber, Custody deletion |

A tier is awarded only if every MUST-pass suite for that tier is `PASS` or its capability is genuinely out of scope.

## Directory layout

```
v1/conformance/
├── README.md                 ← this file
├── fixtures/
│   ├── bearings/             ← canonical Bearing envelopes
│   ├── requests/             ← canonical request bodies
│   └── jurisdictions.json    ← jurisdiction matrix
└── expected/
    ├── verdicts/             ← expected Verdict outputs (signatures ignored on diff)
    └── receipts/             ← expected Receipt shapes (signatures ignored on diff)
```

## Canonical fixture matrix

The v0.1 matrix is intentionally small so it can be reasoned about by humans. Eight Bearing fixtures span the age × confidence × jurisdiction space:

| Fixture | age_band | confidence | issuer | jurisdiction |
| --- | --- | --- | --- | --- |
| `brng_us_ca_1012_attested_apple` | 10-12 | attested | os:apple | US-CA |
| `brng_us_tx_1315_inferred_google` | 13-15 | inferred | os:google | US-TX |
| `brng_eu_de_1617_attested_yoti` | 16-17 | attested | verifier:yoti | DE |
| `brng_uk_69_attested_apple` | 6-9 | attested | os:apple | GB |
| `brng_au_adult_attested_msft` | adult | attested | os:microsoft | AU |
| `brng_us_ny_1315_unverified_roblox` | 13-15 | unverified | account:roblox | US-NY |
| `brng_expired_us_ca_1012` | 10-12 | attested (expired) | os:apple | US-CA |

## Test categories

### Schema (Tier-0 mandatory)

1. Every Bearing fixture validates against `bearing.json`.
2. Every Verdict response validates against `verdict.json`.
3. Every Receipt response validates against `receipt.json`.
4. `signature.value` is base64url; decodes to 64 bytes for ed25519.
5. `bearing_id`, `verdict_id`, `receipt_id` match their regex prefixes.
6. `jurisdictions` array on Verdict is non-empty.
7. `cited` array on every block-Verdict has ≥1 statute reference.
8. `additionalProperties: false` honored — runner injects a junk key and asserts 4xx.

### Semantics (Tier-0 mandatory)

Each case asserts exact `allow`, `reason`, and `cited` for a request/expected-verdict pair in `fixtures/requests/` and `expected/verdicts/`:

1. `req_lens_recommender_1012_us_ca` → deny, `lens:recommender_off_minor`, cites KOSA + CA-AADC.
2. `req_lens_purchase_1012_us_ca` → deny, `threshold:vpc_required`, cites COPPA §312.5.
3. `req_lens_recommender_1617_eu_de` → allow with `lens:recommender_with_transparency`.
4. `req_lens_targeted_ad_1315_us_tx` → deny, `lens:targeted_ad_off_minor`.
5. `req_aegis_csam_any` → deny, `aegis:csam`, even for an adult bearing.
6. `req_aegis_gambling_minor` → deny, `aegis:gambling-minors`.
7. `req_lens_expired_bearing` → deny, `lens:default_deny`.
8. `req_lens_adult_recommender` → allow, `lens:no_applicable_rule`.

### Replay (Tier-1 mandatory, Tier-2 strict)

1. `/notary/sign` on a known Verdict produces a Receipt that wraps it modulo `verdict_id`.
2. `/notary/verify` returns `valid=true, replays=true`.
3. Tampering with `verdict.allow` → verify returns `valid=false`.
4. Tampering with `verdict.cited[0]` → verify returns `valid=false`.
5. Receipt past `expires_at` → verify returns `valid=false`.
6. Receipt signed with rotated key → verify returns `valid=true` if rotation precedes `issued_at`.
7. Re-running Lens against the original Bearing reproduces the Verdict semantically.
8. (Tier-2) Byte-equal canonical-JSON replay matches.

### Negative (Tier-1 mandatory)

1. Malformed Bearing (missing `signature`) → 422 + default-deny on Lens.
2. Expired Bearing → Verdict with `reason=lens:default_deny`.
3. Unknown issuer key_id → Verdict with `reason=lens:default_deny`.
4. Unknown surface → Verdict with `reason=lens:default_deny`, never `allow=true`.
5. Two-jurisdiction conflict with ambiguous rules → stricter wins; jurisdictions array reflects both.
6. PII smuggling: Bearing with `email` at top level → 4xx (additionalProperties).
7. Aegis CSAM on any bearing → deny regardless of age band.
8. Replay attack: same `(bearing_id, evaluated_at)` posted twice → second receipt has distinct `receipt_id` + `issued_at`.

### Privacy (Tier-2 mandatory)

1. No Bearing field outside the schema may carry common PII patterns (email, phone, full date).
2. Receipt `verdict` carries `bearing_id` (opaque) but no name/email/birthdate.
3. Receipts MUST NOT contain the original Bearing envelope — only `bearing_id`.
4. Custody deletion propagates within §8.2 window — runner posts a delete, asserts the bearing is no longer resolvable.
5. Herald subscriber stream batches per §7.2 cadence.
6. Verdict `explanation` echoes only `age_band` + `jurisdiction` from the Bearing.
7. Threshold revocation propagates within the §5.3 freshness window.

## Conformance manifest

A conformance run produces a Notary-style signed manifest:

```jsonc
{
  "spec": "PCSS-v1.0",
  "implementer": "platform:example",
  "tier_claimed": 1,
  "tier_awarded": 1,
  "runner": { "name": "@phosra/conformance", "version": "0.1.0" },
  "endpoint": "https://my-impl.example.com/pcss/v1",
  "executed_at": "2026-05-11T19:00:00Z",
  "fixture_set_hash": "sha256:…",
  "results": [ { "case": "schema-1", "status": "PASS" }, … ],
  "signature": { "alg": "ed25519", "value": "…", "key_id": "implementer:example:conformance-2026" }
}
```

Submission to the public conformance ledger gates the "PCSS Conformant" badge. Tier-2 manifests require an independent witness co-signature from the PCSS witness registry.

## Self-attestation vs. third-party witness

- Tier-0 and Tier-1 are self-attested. Adopters sign, submit, anyone can re-verify against the public fixture set.
- Tier-2 requires a third-party witness — regulator, accredited civil-society body, or foundation-approved auditor. Witness independently runs the suite and co-signs.

A witness enters the loop:

- Always at Tier-2.
- On dispute at Tier-1 (any party may file a dispute against a ledger entry).
- At annual renewal — manifests expire 365 days after `executed_at`.

## Open work

This v0.1 ships:

- ✅ 7 canonical Bearing fixtures
- ✅ 8 request fixtures
- ✅ 8 expected Verdict outputs
- ✅ Jurisdiction registry
- 🟡 Receipt fixtures (placeholder; full set with the v0.2 runner)
- 🔴 Runner integration: Schema + Semantics categories executing (target v0.2)
- 🔴 Replay/Negative/Privacy categories (target v0.3)
- 🔴 Signed-manifest output + ledger submission (target v0.4)
- 🔴 Go port (target v0.5)

Track progress in the [`@phosra/conformance` package](../../sdk-typescript/packages/conformance/) and the issues tagged `area:conformance`.
