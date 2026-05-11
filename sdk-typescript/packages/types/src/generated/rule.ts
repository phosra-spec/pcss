/**
 * @generated from v1/schema/rule.json
 * PCSS spec version: PCSS-v1.0
 */

import type { AgeBand, Capability, DefaultOutcome } from "../index.js"

export interface RuleStatute {
  /** ISO 3166 country code with optional sub-region. */
  jurisdiction: string
  /** e.g., "KOSA-§4(b)(2)". */
  citation: string
  url?: string
}

export interface Rule {
  /** Canonical slug. Pattern: `^[a-z][a-z0-9_]*$`. */
  slug: string
  capability: Capability
  category: string
  statutes: RuleStatute[]
  summary: string
  applies_to_ages?: AgeBand[]
  default_outcome?: DefaultOutcome
  introduced_in?: string
  deprecated_in?: string
}
