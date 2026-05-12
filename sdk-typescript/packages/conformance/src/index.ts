/**
 * @phosra/conformance — Test runner for PCSS v1.0 implementations.
 *
 * v0.2: Schema + Semantics categories executing against any HTTP
 * endpoint speaking the v1/openapi.yaml surface. Replay, Negative, and
 * Privacy categories scaffolded as SKIP — arrive in v0.3.
 *
 *   import { runConformance } from "@phosra/conformance"
 *   const report = await runConformance({ endpoint, tier: 1, implementer })
 */

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { Bearing, Verdict } from "@phosra/types"

export type ConformanceTier = 0 | 1 | 2

export interface ConformanceRunOptions {
  endpoint: string
  tier: ConformanceTier
  implementer: string
  authHeader?: string
  fixturesDir?: string
  expectedDir?: string
  capabilities?: string[]
  allowClockSkew?: number
  fetch?: typeof fetch
}

export type ConformanceCategory = "schema" | "semantics" | "replay" | "negative" | "privacy"

export interface ConformanceCaseResult {
  case: string
  category: ConformanceCategory
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
  summary: { total: number; passed: number; failed: number; skipped: number }
}

const RUNNER_VERSION = "0.2.0"

/**
 * Run the conformance suite against an implementation endpoint.
 */
export async function runConformance(opts: ConformanceRunOptions): Promise<ConformanceReport> {
  const fixturesDir = opts.fixturesDir ?? resolveDefaultDir("fixtures")
  const expectedDir = opts.expectedDir ?? resolveDefaultDir("expected")
  const fetcher = opts.fetch ?? globalThis.fetch
  const results: ConformanceCaseResult[] = []

  const bearings = loadBearings(join(fixturesDir, "bearings"))
  const requests = loadRequests(join(fixturesDir, "requests"))
  const expected = loadExpected(join(expectedDir, "verdicts"))

  // ── Schema cases ──────────────────────────────────────────────────────
  results.push(checkSchemaBearings(bearings))

  // ── Semantics cases ───────────────────────────────────────────────────
  for (const [reqName, req] of Object.entries(requests)) {
    const bearing = bearings[req.bearing_fixture]
    const expectedVerdict = expected[req.expected_verdict_fixture]
    if (!bearing) {
      results.push({
        case: `semantics:${reqName}`,
        category: "semantics",
        status: "SKIP",
        message: `bearing fixture ${req.bearing_fixture} not found`,
      })
      continue
    }
    if (!expectedVerdict) {
      results.push({
        case: `semantics:${reqName}`,
        category: "semantics",
        status: "SKIP",
        message: `expected fixture ${req.expected_verdict_fixture} not found`,
      })
      continue
    }
    const result = await runSemanticsCase(
      reqName,
      req,
      bearing,
      expectedVerdict,
      opts.endpoint,
      fetcher,
      opts.authHeader,
    )
    results.push(result)
  }

  // ── Replay / Negative / Privacy: scaffolded as SKIP ───────────────────
  if (opts.tier >= 1) {
    results.push({
      case: "replay:notary-roundtrip",
      category: "replay",
      status: "SKIP",
      message: "Replay category arrives in @phosra/conformance@0.3",
    })
    results.push({
      case: "negative:expired-bearing",
      category: "negative",
      status: "SKIP",
      message: "Negative category arrives in @phosra/conformance@0.3",
    })
  }
  if (opts.tier >= 2) {
    results.push({
      case: "privacy:no-pii-in-receipt",
      category: "privacy",
      status: "SKIP",
      message: "Privacy category arrives in @phosra/conformance@0.4",
    })
  }

  const tier_awarded = computeTierAwarded(results, opts.tier)
  const summary = summarize(results)

  return {
    spec: "PCSS-v1.0",
    implementer: opts.implementer,
    tier_claimed: opts.tier,
    tier_awarded,
    runner: { name: "@phosra/conformance", version: RUNNER_VERSION },
    endpoint: opts.endpoint,
    executed_at: new Date().toISOString(),
    fixture_set_hash: "sha256:not-yet-implemented",
    results,
    summary,
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

function loadBearings(dir: string): Record<string, Bearing> {
  const out: Record<string, Bearing> = {}
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue
      const slug = f.replace(/\.json$/, "")
      const content = JSON.parse(readFileSync(join(dir, f), "utf8"))
      out[slug] = content
    }
  } catch {
    // dir missing — runner will skip
  }
  return out
}

interface RequestFixture {
  operation: string
  bearing_fixture: string
  body: Record<string, unknown>
  expected_verdict_fixture: string
}

function loadRequests(dir: string): Record<string, RequestFixture> {
  const out: Record<string, RequestFixture> = {}
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue
      const slug = f.replace(/\.json$/, "")
      const content = JSON.parse(readFileSync(join(dir, f), "utf8")) as RequestFixture & { $comment?: string }
      if ("$comment" in content) delete (content as { $comment?: string }).$comment
      out[slug] = content
    }
  } catch {}
  return out
}

type ExpectedFixture = Partial<Verdict> & { bearing_id_from_fixture?: string }

function loadExpected(dir: string): Record<string, ExpectedFixture> {
  const out: Record<string, ExpectedFixture> = {}
  try {
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".json")) continue
      const slug = f.replace(/\.json$/, "")
      const content = JSON.parse(readFileSync(join(dir, f), "utf8")) as ExpectedFixture & { $comment?: string }
      if ("$comment" in content) delete (content as { $comment?: string }).$comment
      out[slug] = content
    }
  } catch {}
  return out
}

function checkSchemaBearings(bearings: Record<string, Bearing>): ConformanceCaseResult {
  const issues: string[] = []
  for (const [name, b] of Object.entries(bearings)) {
    if (!b.bearing_id?.startsWith("brng_")) issues.push(`${name}: bearing_id missing brng_ prefix`)
    if (!["0-5", "6-9", "10-12", "13-15", "16-17", "adult"].includes(b.age_band as string))
      issues.push(`${name}: bad age_band ${b.age_band}`)
    if (!["attested", "inferred", "unverified"].includes(b.confidence as string))
      issues.push(`${name}: bad confidence ${b.confidence}`)
    if (!b.signature || b.signature.alg !== "ed25519") issues.push(`${name}: signature.alg != ed25519`)
  }
  return issues.length === 0
    ? { case: "schema:bearings", category: "schema", status: "PASS" }
    : { case: "schema:bearings", category: "schema", status: "FAIL", message: issues.join("; ") }
}

async function runSemanticsCase(
  name: string,
  req: RequestFixture,
  bearing: Bearing,
  expected: ExpectedFixture,
  endpoint: string,
  fetcher: typeof fetch,
  authHeader: string | undefined,
): Promise<ConformanceCaseResult> {
  const path =
    req.operation === "lens.evaluate"
      ? "/lens/evaluate"
      : req.operation === "aegis.check"
        ? "/aegis/check"
        : null
  if (!path) {
    return {
      case: `semantics:${name}`,
      category: "semantics",
      status: "SKIP",
      message: `operation ${req.operation} not yet wired in runner`,
    }
  }
  const url = endpoint.replace(/\/$/, "") + path
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  }
  if (authHeader) {
    const idx = authHeader.indexOf(": ")
    if (idx > 0) {
      headers[authHeader.slice(0, idx).toLowerCase()] = authHeader.slice(idx + 2)
    }
  }

  let response: Response
  try {
    response = await fetcher(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ bearing, ...req.body }),
    })
  } catch (err) {
    return {
      case: `semantics:${name}`,
      category: "semantics",
      status: "FAIL",
      message: `network error: ${String(err)}`,
    }
  }
  if (!response.ok) {
    return {
      case: `semantics:${name}`,
      category: "semantics",
      status: "FAIL",
      message: `HTTP ${response.status}`,
    }
  }
  const got = (await response.json()) as Verdict

  const issues: string[] = []
  if (got.allow !== expected.allow) issues.push(`allow: got ${got.allow}, want ${expected.allow}`)
  if (got.reason !== expected.reason) issues.push(`reason: got ${got.reason}, want ${expected.reason}`)
  if (Array.isArray(expected.cited)) {
    const want = new Set(expected.cited)
    const have = new Set(got.cited ?? [])
    for (const c of want) if (!have.has(c)) issues.push(`cited: missing ${c}`)
  }

  return issues.length === 0
    ? { case: `semantics:${name}`, category: "semantics", status: "PASS" }
    : { case: `semantics:${name}`, category: "semantics", status: "FAIL", message: issues.join("; ") }
}

function summarize(results: ConformanceCaseResult[]): ConformanceReport["summary"] {
  let passed = 0,
    failed = 0,
    skipped = 0
  for (const r of results) {
    if (r.status === "PASS") passed++
    else if (r.status === "FAIL") failed++
    else skipped++
  }
  return { total: results.length, passed, failed, skipped }
}

function computeTierAwarded(results: ConformanceCaseResult[], claimed: ConformanceTier): ConformanceTier | null {
  const anyFail = results.some((r) => r.status === "FAIL")
  if (anyFail) return null
  return claimed
}

function resolveDefaultDir(kind: "fixtures" | "expected"): string {
  let cur = process.cwd()
  for (let i = 0; i < 8; i++) {
    const candidate = join(cur, "v1", "conformance", kind)
    try {
      readdirSync(candidate)
      return candidate
    } catch {}
    cur = join(cur, "..")
  }
  throw new Error(`could not locate v1/conformance/${kind} — pass fixturesDir/expectedDir explicitly`)
}

export type { Verdict, Bearing }
