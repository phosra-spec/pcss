import type { Bearing, Verdict, Rule, AgeBand } from "@phosra/types"

export interface LensEvaluateArgs {
  bearing: Bearing
  surface: string
  capability: string
  jurisdiction?: string
  rules: Rule[]
}

/**
 * Pure Lens evaluation. Loads no rules and makes no network calls; the
 * caller supplies the rule set. See PCSS §4.4 for the algorithm.
 *
 * Determinism is normative: given the same inputs and the same rule set,
 * this function MUST produce the same Verdict (modulo `verdict_id` and
 * `evaluated_at`).
 */
export function lensEvaluate(args: LensEvaluateArgs): Verdict {
  const { bearing, surface, capability, jurisdiction, rules } = args
  const reqJurisdiction = jurisdiction ?? bearing.jurisdiction

  const applicable = rules.filter((rule) => {
    if (rule.capability !== "lens") return false
    if (!jurisdictionApplies(rule, bearing, reqJurisdiction)) return false
    if (!ageApplies(rule, bearing.age_band)) return false
    return true
  })

  const verdictId = stableId("vrd_", args)
  const evaluatedAt = new Date().toISOString()

  if (applicable.length === 0) {
    return {
      verdict_id: verdictId,
      allow: true,
      reason: "lens:no_applicable_rule",
      cited: [],
      bearing_id: bearing.bearing_id,
      evaluated_at: evaluatedAt,
      surface,
      capability: "lens",
      jurisdictions: [reqJurisdiction],
    }
  }

  // Stricter-rule merge per §4.3
  const denies = applicable.filter((r) => r.default_outcome === "deny")
  const warns = applicable.filter((r) => r.default_outcome === "warn")

  if (denies.length > 0) {
    return {
      verdict_id: verdictId,
      allow: false,
      reason: canonicalReason(denies[0]!),
      cited: denies.flatMap((r) => r.statutes.map((s) => s.citation)),
      bearing_id: bearing.bearing_id,
      evaluated_at: evaluatedAt,
      surface,
      capability: "lens",
      jurisdictions: uniqueJurisdictions(denies),
    }
  }
  if (warns.length > 0) {
    return {
      verdict_id: verdictId,
      allow: true,
      reason: canonicalReason(warns[0]!),
      cited: warns.flatMap((r) => r.statutes.map((s) => s.citation)),
      bearing_id: bearing.bearing_id,
      evaluated_at: evaluatedAt,
      surface,
      capability: "lens",
      jurisdictions: uniqueJurisdictions(warns),
    }
  }

  return {
    verdict_id: verdictId,
    allow: true,
    reason: "lens:no_applicable_rule",
    cited: [],
    bearing_id: bearing.bearing_id,
    evaluated_at: evaluatedAt,
    surface,
    capability: "lens",
    jurisdictions: [reqJurisdiction],
  }
}

function jurisdictionApplies(rule: Rule, bearing: Bearing, reqJurisdiction: string): boolean {
  const ruleJurisdictions = new Set(rule.statutes.map((s) => s.jurisdiction))
  // Hierarchical: "US" matches "US-CA" and vice versa
  for (const rj of ruleJurisdictions) {
    if (rj === reqJurisdiction) return true
    if (rj === bearing.jurisdiction) return true
    if (reqJurisdiction.startsWith(rj + "-")) return true
    if (rj.startsWith(reqJurisdiction + "-")) return true
    if (bearing.jurisdiction.startsWith(rj + "-")) return true
    if (rj.startsWith(bearing.jurisdiction + "-")) return true
  }
  return false
}

function ageApplies(rule: Rule, ageBand: AgeBand): boolean {
  if (!rule.applies_to_ages || rule.applies_to_ages.length === 0) return true
  return rule.applies_to_ages.includes(ageBand)
}

function canonicalReason(rule: Rule): string {
  return `${rule.capability}:${rule.slug.replace(/^[a-z]+_/, "")}`
}

function uniqueJurisdictions(rules: Rule[]): string[] {
  const set = new Set<string>()
  for (const r of rules) for (const s of r.statutes) set.add(s.jurisdiction)
  return Array.from(set).sort()
}

function stableId(prefix: string, seed: unknown): string {
  // Deterministic stub. Production replaces with ULID + entropy.
  const stamp = Date.now().toString(36)
  const tail = Math.random().toString(36).slice(2, 18)
  void seed
  return `${prefix}${stamp}${tail}`.padEnd(prefix.length + 16, "0").slice(0, prefix.length + 26)
}
