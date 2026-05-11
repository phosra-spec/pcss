/**
 * @generated from v1/schema/bearing.json
 * PCSS spec version: PCSS-v1.0
 * DO NOT EDIT — run `pnpm -F @phosra/types generate`
 * @see PCSS §3
 */

import type { AgeBand, Confidence } from "../index.js"

/** The canonical age signal envelope. See PCSS §3. */
export interface Bearing {
  /** Stable, opaque identifier. Pattern: `^brng_[A-Za-z0-9_-]{16,128}$`. */
  bearing_id: string
  age_band: AgeBand
  confidence: Confidence
  /** ISO 8601 timestamp when this envelope was issued. */
  issued_at: string
  /** Optional ISO 8601 timestamp after which the envelope MUST be re-issued. */
  expires_at?: string
  /** Issuer ID, e.g., "os:apple". Pattern: `^(os|account|verifier|civil-society):[a-z0-9-]+$`. */
  issuer: string
  /** ISO 3166 country code with optional sub-region. Pattern: `^[A-Z]{2}(-[A-Z]{2,3})?$`. */
  jurisdiction: string
  signature: {
    alg: "ed25519"
    /** Base64url-encoded signature over canonical envelope (signature object excluded). */
    value: string
    /** Issuer's key identifier; resolves to a public key in the PCSS registry. */
    key_id?: string
  }
  /** Implementer-specific extensions. Keys MUST carry a vendor prefix. */
  extensions?: Record<string, unknown>
}
