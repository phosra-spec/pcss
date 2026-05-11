/**
 * @phosra/sdk — Reference TypeScript SDK for PCSS v1.0
 *
 * Quickstart:
 *   import { phosra } from "@phosra/sdk"
 *   const bearing = await phosra.bearing.identify({ subject, jurisdiction })
 *   const verdict = await phosra.lens.evaluate({ bearing, surface, capability, jurisdiction })
 *   const receipt = await phosra.notary.sign({ verdict })
 *
 * Server-side helpers (no network):
 *   import { canonicalize, lensEvaluate, notarySign } from "@phosra/sdk/server"
 *
 * @see https://github.com/phosra-spec/pcss
 */

export { PhosraClient, PhosraError } from "./client.js"
export { phosra } from "./default-client.js"
export type {
  PhosraClientOptions,
  PhosraAuth,
  PhosraErrorCode,
} from "./client.js"

// Re-export types so adopters don't need to install @phosra/types separately
export type {
  Bearing,
  Verdict,
  Receipt,
  Threshold,
  Herald,
  Custody,
  Rule,
  AgeBand,
  Confidence,
  Capability,
} from "@phosra/types"
