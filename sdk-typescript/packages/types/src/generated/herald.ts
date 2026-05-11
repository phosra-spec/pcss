/**
 * @generated from v1/schema/herald.json
 * PCSS spec version: PCSS-v1.0
 * @see PCSS §7
 */

export type HeraldSurface = "parent" | "regulator" | "civil-society"
export type HeraldCadence = "immediate" | "daily" | "weekly" | "monthly" | "on-request"

export interface HeraldEvent {
  event_type: string
  occurred_at: string
  receipt_id?: string
  bearing_id?: string
  consent_id?: string
  summary?: string
  extensions?: Record<string, unknown>
}

/** Notification + reports envelope. See PCSS §7. */
export interface Herald {
  /** Pattern: `^hrld_[A-Za-z0-9_-]{16,128}$`. */
  herald_id: string
  surface: HeraldSurface
  cadence?: HeraldCadence
  events: HeraldEvent[]
  issued_at: string
  issuer: string
  subscriber?: string
  signature: {
    alg: "ed25519"
    value: string
    key_id: string
  }
  extensions?: Record<string, unknown>
}
