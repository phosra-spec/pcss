/**
 * @generated from v1/schema/verdict.json
 * PCSS spec version: PCSS-v1.0
 * @see PCSS §9
 */

import type { Capability } from "../index.js"

/** The output of a Lens evaluation, Threshold consent check, or Aegis block. See PCSS §9. */
export interface Verdict {
  /** Stable opaque identifier. Pattern: `^vrd_[A-Za-z0-9_-]{16,128}$`. */
  verdict_id: string
  allow: boolean
  /** Registered PCSS reason code. Format: 'capability:short-name'. Pattern: `^[a-z]+:[a-z0-9_-]+$`. */
  reason: string
  /** Statute or treaty citations that justify this verdict. */
  cited: string[]
  /** Reference to the Bearing envelope that produced this verdict. */
  bearing_id: string
  /** ISO 8601 timestamp of evaluation. */
  evaluated_at: string
  /** Human-readable explanation (used in regulator/parent notifications). Max 1000 chars. */
  explanation?: string
  /** Registered surface identifier. */
  surface?: string
  /** The runtime capability that produced this verdict. */
  capability?: Capability
  /** All jurisdictions cited in the verdict. */
  jurisdictions?: string[]
  extensions?: Record<string, unknown>
}
