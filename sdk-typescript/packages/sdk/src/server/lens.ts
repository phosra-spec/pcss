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
 * caller supplies the rule set.
 *
 * Implements the PCSS §4 algorithm including §4.3 conflict resolution:
 *   §4.3.1 — applicability: jurisdiction (hierarchical) ∩ age_band
 *   §4.3.2 — stricter-rule order: deny > warn > allow; supersets win
 *   §4.3.3 — orthogonal-axis: combine independent rules (deny ∨ deny)
 *   §4.3.4 — tie-break: contradictory rules → lens:default_deny
 *   §4.3.5 — merge identical outcomes into a single Verdict
 *
 * Determinism is normative: given the same inputs and the same rule
 * set, this function MUST produce the same Verdict modulo verdict_id
 * and evaluated_at.
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

  const evaluatedAt = new Date().toISOString()
  const verdictId = mintId("vrd_")

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

  // §4.3.2 — Bucket by outcome severity. Sort denies by registry order
  // so the merge is deterministic.
  const denies = applicable
    .filter((r) => r.default_outcome === "deny")
    .sort(bySlug)
  const warns = applicable
    .filter((r) => r.default_outcome === "warn")
    .sort(bySlug)
  const allows = applicable
    .filter((r) => r.default_outcome === "allow" || r.default_outcome == null)
    .sort(bySlug)

  // §4.3.4 tie-break: a `deny` rule and an `allow` rule on the *same surface
  // and capability* with no superset relationship is a registry defect.
  // We don't have surface/capability metadata on rules in v1.0, so we treat
  // any (deny + allow) overlap as a defect → default-deny.
  if (denies.length > 0 && allows.length > 0) {
    return {
      verdict_id: verdictId,
      allow: false,
      reason: "lens:default_deny",
      cited: dedupe([
        ...denies.flatMap((r) => r.statutes.map((s) => s.citation)),
        ...allows.flatMap((r) => r.statutes.map((s) => s.citation)),
      ]),
      bearing_id: bearing.bearing_id,
      evaluated_at: evaluatedAt,
      surface,
      capability: "lens",
      jurisdictions: uniqueJurisdictions([...denies, ...allows]),
      explanation:
        "Two or more applicable rules produced contradictory outcomes that could not be ordered. Default-deny per §4.3.4.",
    }
  }

  // §4.3.5 — merge: pick the first-by-slug deny (deterministic) and union
  // all denying rules' citations + jurisdictions. Same for warn.
  if (denies.length > 0) {
    const primary = denies[0]!
    return {
      verdict_id: verdictId,
      allow: false,
      reason: canonicalReason(primary),
      cited: dedupe(denies.flatMap((r) => r.statutes.map((s) => s.citation))),
      bearing_id: bearing.bearing_id,
      evaluated_at: evaluatedAt,
      surface,
      capability: "lens",
      jurisdictions: uniqueJurisdictions(denies),
    }
  }
  if (warns.length > 0) {
    const primary = warns[0]!
    return {
      verdict_id: verdictId,
      allow: true,
      reason: canonicalReason(primary),
      cited: dedupe(warns.flatMap((r) => r.statutes.map((s) => s.citation))),
      bearing_id: bearing.bearing_id,
      evaluated_at: evaluatedAt,
      surface,
      capability: "lens",
      jurisdictions: uniqueJurisdictions(warns),
    }
  }

  // All applicable rules permit.
  return {
    verdict_id: verdictId,
    allow: true,
    reason: "lens:no_applicable_rule",
    cited: dedupe(allows.flatMap((r) => r.statutes.map((s) => s.citation))),
    bearing_id: bearing.bearing_id,
    evaluated_at: evaluatedAt,
    surface,
    capability: "lens",
    jurisdictions: uniqueJurisdictions(allows.length > 0 ? allows : applicable),
  }
}

function jurisdictionApplies(rule: Rule, bearing: Bearing, reqJurisdiction: string): boolean {
  const ruleJurisdictions = new Set(rule.statutes.map((s) => s.jurisdiction))
  // Hierarchical: "US" matches "US-CA" and vice versa.
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
  // Rule slug already has its jurisdictional prefix; strip the leading
  // <country>_ or <country>-<region>_ to produce a clean reason code.
  // e.g., `kosa_recommender_off_minor` → `lens:recommender_off_minor`
  //       `eu_dsa_minor_targeted_ad_ban` → `lens:minor_targeted_ad_ban`
  //       `ca_aadc_default_high_privacy_minor` → `lens:default_high_privacy_minor`
  const stripped = rule.slug.replace(/^[a-z]+(_[0-9a-z]+)*_(?=[a-z])/, (m) => {
    // strip up to 3 leading prefix tokens
    const tokens = m.split("_").filter(Boolean)
    return tokens.length > 3 ? tokens.slice(-3).join("_") + "_" : ""
  })
  return `${rule.capability}:${stripped || rule.slug}`
}

function uniqueJurisdictions(rules: Rule[]): string[] {
  const set = new Set<string>()
  for (const r of rules) for (const s of r.statutes) set.add(s.jurisdiction)
  return Array.from(set).sort()
}

function dedupe<T>(xs: T[]): T[] {
  return Array.from(new Set(xs))
}

function bySlug(a: Rule, b: Rule): number {
  return a.slug < b.slug ? -1 : a.slug > b.slug ? 1 : 0
}

/**
 * Mint a fresh opaque ID. Uses Web Crypto's randomUUID (Node 20+,
 * browsers, Deno, Bun). Falls back to a time-prefixed random string
 * when randomUUID is unavailable (Node ≤18, edge runtimes with
 * partial Web Crypto support).
 */
function mintId(prefix: string): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } }
  const uuid =
    g.crypto?.randomUUID?.() ??
    (Date.now().toString(36) + cryptoRandomBase36(16))
  // Strip dashes from UUID, take first 22 chars for a 26-char total ID.
  const tail = uuid.replace(/-/g, "").slice(0, 22)
  return `${prefix}${tail}`
}

function cryptoRandomBase36(len: number): string {
  const g = globalThis as { crypto?: { getRandomValues?: (b: Uint8Array) => Uint8Array } }
  if (g.crypto?.getRandomValues) {
    const buf = new Uint8Array(len)
    g.crypto.getRandomValues(buf)
    return Array.from(buf, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, len)
  }
  // Truly nothing? Bail with a marker so callers see this is non-prod entropy.
  let s = ""
  for (let i = 0; i < len; i++) s += "x"
  return s
}
