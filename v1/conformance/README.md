# PCSS Conformance Test Plan

A "PCSS-Conformant" implementer is one that passes the test plan defined here. The conformance suite is intentionally portable: it runs against any HTTP endpoint that speaks the [OpenAPI surface](../openapi.yaml).

## Status

**Stub.** This directory captures the structure of the conformance suite during v1.0 public review. A full, executable test runner ships before any implementer can claim the "Phosra Conformant" badge.

## Conformance levels

| Level | Required | Notes |
|---|---|---|
| **Tier-0 Implementer** | Bearing read + Lens evaluate + Notary sign | Minimum to invoke the spec at all. |
| **Tier-1 Adopter** | Above + Threshold check + Aegis hard-blocks | Required to ship to consumer-facing surfaces. |
| **Tier-2 Custodian** | Above + Herald subscriber stream + Custody deletion propagation + Verdict transparency log | Required to ship to regulator-facing surfaces. |

A conformance run produces a signed receipt itself (eat your own dog food); the receipt is published to the public conformance ledger.

## Test categories

1. **Schema** — every wire-format envelope round-trips through the JSON Schema validators.
2. **Semantics** — a curated set of canonical Verdict scenarios produces the expected `reason` codes.
3. **Replay** — a Notary Receipt re-evaluates against the implementer's Lens and produces an identical Verdict.
4. **Negative** — implementers correctly default-deny on malformed Bearings, expired signatures, and rule-conflict ambiguity.
5. **Privacy** — bearing envelopes leak no PII; receipts redact subject identifiers; Herald streams batch on the cadence specified in §7.

## File layout

```
v1/conformance/
├── README.md              ← this file
├── fixtures/              ← canonical inputs (Bearings, surfaces, jurisdictions)
├── expected/              ← canonical outputs (Verdicts, Receipts)
└── runner/                ← test runner (TypeScript; future Go port for Phosra impl)
```

Fixtures and runner ship in a follow-up PR. The conformance suite is the highest-leverage piece of the spec to land next; it converts PCSS from prose into something you can pass-or-fail against.
