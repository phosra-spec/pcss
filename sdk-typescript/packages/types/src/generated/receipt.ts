/**
 * @generated from v1/schema/receipt.json
 * PCSS spec version: PCSS-v1.0
 * @see PCSS §10
 */

import type { Verdict } from "./verdict.js"

/** Regulator-ready signed enforcement receipt. See PCSS §10. */
export interface Receipt {
  /** Stable opaque identifier. Pattern: `^ntry_[A-Za-z0-9_-]{16,128}$`. */
  receipt_id: string
  /** The wrapped Verdict envelope. */
  verdict: Verdict
  /** Reference to the underlying Bearing envelope (for replay). */
  bearing_id: string
  issued_at: string
  /** Optional receipt expiration. Default: 7 years. */
  expires_at?: string
  /** PCSS version under which this receipt was generated. */
  spec: string
  signature: {
    alg: "ed25519"
    value: string
    key_id: string
    /** Optional RFC 3161 trusted timestamp authority identifier. */
    timestamp_authority?: string
  }
  /** Registered identifier of the implementer that emitted this receipt. */
  implementer?: string
  extensions?: Record<string, unknown>
}
