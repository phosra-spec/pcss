/**
 * @phosra/types — TypeScript types for PCSS v1.0
 *
 * Generated from v1/schema/*.json with hand-written ergonomic overlay.
 * Spec version: PCSS-v1.0 (public review)
 *
 * DO NOT EDIT GENERATED FILES under src/generated/. Run `pnpm -F @phosra/types generate`.
 */

// Re-export generated types with branded ID overlay
export * from "./generated/bearing.js"
export * from "./generated/verdict.js"
export * from "./generated/receipt.js"
export * from "./generated/threshold.js"
export * from "./generated/herald.js"
export * from "./generated/custody.js"
export * from "./generated/rule.js"

// Ergonomic overlays — named types promoted from string-literal unions
export type AgeBand = "0-5" | "6-9" | "10-12" | "13-15" | "16-17" | "adult"
export type Confidence = "attested" | "inferred" | "unverified"
export type Capability =
  | "charter"
  | "bearing"
  | "lens"
  | "threshold"
  | "aegis"
  | "herald"
  | "custody"
  | "verdict"
  | "notary"

/** Default outcome for a rule when no stricter rule overrides. */
export type DefaultOutcome = "allow" | "deny" | "warn"

/** Branded ID types — prevent accidentally passing a verdict_id to a bearing_id slot. */
declare const __brand: unique symbol
type Brand<T, B> = T & { readonly [__brand]: B }

export type BearingId = Brand<string, "BearingId">
export type VerdictId = Brand<string, "VerdictId">
export type ReceiptId = Brand<string, "ReceiptId">
export type ConsentId = Brand<string, "ConsentId">
export type HeraldId = Brand<string, "HeraldId">
export type CustodyId = Brand<string, "CustodyId">

/** Helper: assert a string matches a branded ID prefix. */
export function brandId<T>(value: string, prefix: string): T {
  if (!value.startsWith(prefix + "_")) {
    throw new TypeError(`expected ID with prefix "${prefix}_", got "${value}"`)
  }
  return value as unknown as T
}

/** Spec version this types package was built against. */
export const PCSS_SPEC_VERSION = "PCSS-v1.0" as const
