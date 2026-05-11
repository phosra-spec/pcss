/**
 * @generated from v1/schema/threshold.json
 * PCSS spec version: PCSS-v1.0
 * @see PCSS §5
 */

export type VpcMethod =
  | "credit-card-plus-one"
  | "knowledge-based-authentication"
  | "signed-form"
  | "government-id-match"
  | "video-conference"
  | "facial-age-estimation"
  | "third-party-verifier"

/** Verifiable parental consent envelope. See PCSS §5. */
export interface Threshold {
  /** Pattern: `^thsh_[A-Za-z0-9_-]{16,128}$`. */
  consent_id: string
  bearing_id: string
  granted_scope: string[]
  vpc?: boolean
  vpc_method?: VpcMethod
  issued_at: string
  expires_at?: string
  revoked_at?: string
  issuer: string
  jurisdiction: string
  signature: {
    alg: "ed25519"
    value: string
    key_id: string
  }
  extensions?: Record<string, unknown>
}
