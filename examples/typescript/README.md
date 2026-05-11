# PCSS TypeScript example

This is a minimal worked example of the PCSS runtime flow: **Bearing → Lens → Notary**. It demonstrates the canonical signing path that every Charter Adopter implements.

The example is in two parts:

1. [`hello.ts`](hello.ts) — calling the reference Phosra implementation as a Lens Consumer.
2. [`implementer.ts`](implementer.ts) — implementing the PCSS surface yourself, for adopters who run their own Lens/Notary.

The spec itself is at [`v1/pcss-v1.0.md`](../../v1/pcss-v1.0.md). The OpenAPI surface is at [`v1/openapi.yaml`](../../v1/openapi.yaml).

## Run it

```bash
# Once @phosra/sdk publishes (target 2026-Q3):
npm install @phosra/sdk

npx tsx hello.ts
```

Until the SDK ships, this file is documentation: it is the canonical example of what the SDK consumes.

## What the flow does

```
┌────────────┐                ┌────────────┐                ┌────────────┐
│  Bearing   │                │    Lens    │                │   Notary   │
│  Provider  │                │  Evaluator │                │   Signer   │
└─────┬──────┘                └──────┬─────┘                └──────┬─────┘
      │                              │                              │
      │   1. bearing.identify()      │                              │
      │  ──────────────────────────► │                              │
      │                              │                              │
      │                  Bearing     │                              │
      │  ◄────────────────────────── │                              │
      │                              │                              │
      │                              │   2. lens.evaluate(bearing)  │
      │                              │  ─────────────────────────►  │
      │                              │                              │
      │                              │              Verdict         │
      │                              │  ◄─────────────────────────  │
      │                              │                              │
      │                              │   3. notary.sign(verdict)    │
      │                              │  ─────────────────────────►  │
      │                              │                              │
      │                              │              Receipt         │
      │                              │  ◄─────────────────────────  │
```

The receipt is what a regulator subscribes to. The bearing carries no PII; only an opaque `bearing_id` and the age band.
