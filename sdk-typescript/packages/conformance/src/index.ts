/**
 * @phosra/conformance — Test runner for PCSS v1.0 implementations.
 *
 * Status: scaffolded; fixture set + runner ship per ROADMAP H1.1.
 *
 * Programmatic usage:
 *   import { runConformance } from "@phosra/conformance"
 *   const report = await runConformance({ endpoint, tier: 1, implementer })
 *
 * CLI usage:
 *   npx @phosra/conformance --endpoint=... --tier=1 --implementer=platform:example
 */

import type { Verdict, Receipt } from "@phosra/types"

export type ConformanceTier = 0 | 1 | 2

export interface ConformanceRunOptions {
  endpoint: string
  tier: ConformanceTier
  implementer: string
  /** Auth header value, e.g., "Bearer <token>". */
  authHeader?: string
  /** Path to ed25519 PEM for signing the manifest. */
  signingKeyPath?: string
  /** Path to write the manifest. */
  reportPath?: string
  /** Restrict to declared capabilities. */
  capabilities?: string[]
  /** Tolerance for evaluated_at skew. */
  allowClockSkew?: number
}

export interface ConformanceCaseResult {
  case: string
  category: "schema" | "semantics" | "replay" | "negative" | "privacy"
  status: "PASS" | "FAIL" | "SKIP"
  message?: string
}

export interface ConformanceReport {
  spec: "PCSS-v1.0"
  implementer: string
  tier_claimed: ConformanceTier
  tier_awarded: ConformanceTier | null
  runner: { name: "@phosra/conformance"; version: string }
  endpoint: string
  executed_at: string
  fixture_set_hash: string
  results: ConformanceCaseResult[]
}

/**
 * Run the conformance suite against an implementation endpoint.
 *
 * SCAFFOLD: this is a stub that returns an empty report. The full
 * runner with the 30+ test cases lands in 0.2.x per ROADMAP H1.1.
 */
export async function runConformance(opts: ConformanceRunOptions): Promise<ConformanceReport> {
  return {
    spec: "PCSS-v1.0",
    implementer: opts.implementer,
    tier_claimed: opts.tier,
    tier_awarded: null,
    runner: { name: "@phosra/conformance", version: "0.1.0" },
    endpoint: opts.endpoint,
    executed_at: new Date().toISOString(),
    fixture_set_hash: "sha256:not-yet-implemented",
    results: [],
  }
}

export type { Verdict, Receipt }
