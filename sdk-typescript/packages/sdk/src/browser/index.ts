/**
 * @phosra/sdk/browser — browser-safe entry.
 *
 * Re-exports the network client; omits server-side helpers that depend
 * on Node's `node:crypto` (browser ed25519 is provided by @noble/ed25519
 * directly under the /server subpath).
 */
export { PhosraClient, PhosraError, phosra } from "../index.js"
export type {
  PhosraClientOptions,
  PhosraAuth,
  PhosraErrorCode,
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
} from "../index.js"
