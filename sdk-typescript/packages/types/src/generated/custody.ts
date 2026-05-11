/**
 * @generated from v1/schema/custody.json
 * PCSS spec version: PCSS-v1.0
 * @see PCSS §8
 */

export type CustodyAction =
  | "retention-declaration"
  | "deletion-request"
  | "deletion-completion"
  | "export-request"
  | "export-completion"

/** Data minimization + deletion envelope. See PCSS §8. */
export interface Custody {
  /** Pattern: `^cstd_[A-Za-z0-9_-]{16,128}$`. */
  custody_id: string
  action: CustodyAction
  subject_ref: {
    bearing_id?: string
    consent_id?: string
  }
  scope?: string[]
  retention_until?: string
  statutory_basis?: string[]
  propagation_deadline?: string
  completion_receipt?: {
    deleted_at?: string
    downstream_consumers?: string[]
    tombstone_id?: string
  }
  issued_at: string
  issuer: string
  jurisdiction?: string
  signature: {
    alg: "ed25519"
    value: string
    key_id: string
  }
  extensions?: Record<string, unknown>
}
