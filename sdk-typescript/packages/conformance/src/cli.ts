#!/usr/bin/env node
/**
 * CLI for @phosra/conformance.
 *
 * Usage:
 *   npx @phosra/conformance \
 *     --endpoint=https://my-impl.example.com/pcss/v1 \
 *     --tier=1 \
 *     --implementer=platform:example
 */

import { runConformance, type ConformanceTier } from "./index.js"

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {}
  for (const a of argv) {
    const m = a.match(/^--([^=]+)=(.+)$/)
    if (m) out[m[1]!] = m[2]!
  }
  return out
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  if (!args.endpoint || !args.tier || !args.implementer) {
    console.error("usage: pcss-conformance --endpoint=URL --tier=0|1|2 --implementer=ID")
    process.exit(2)
  }

  const report = await runConformance({
    endpoint: args.endpoint,
    tier: Number(args.tier) as ConformanceTier,
    implementer: args.implementer,
    ...(args["auth-header"] ? { authHeader: args["auth-header"] } : {}),
  })

  const json = JSON.stringify(report, null, 2)
  if (args.report) {
    const { writeFileSync } = await import("node:fs")
    writeFileSync(args.report, json)
    console.error(`report written to ${args.report}`)
  } else {
    process.stdout.write(json + "\n")
  }
  process.exit(report.tier_awarded != null ? 0 : 1)
}

main().catch((err) => {
  console.error("pcss-conformance failed:", err)
  process.exit(2)
})
