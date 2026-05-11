#!/usr/bin/env node
/**
 * `phosra` CLI — front door for PCSS-related tooling.
 *
 * Commands:
 *   phosra verify <receipt.json>
 *   phosra conformance run --endpoint=URL --tier=1 --implementer=ID
 *   phosra types generate
 */

import { readFileSync } from "node:fs"
import { PhosraClient } from "@phosra/sdk"

async function main() {
  const [command, ...rest] = process.argv.slice(2)

  switch (command) {
    case "verify": {
      const path = rest[0]
      if (!path) {
        console.error("usage: phosra verify <receipt.json>")
        process.exit(2)
      }
      const receipt = JSON.parse(readFileSync(path, "utf8"))
      const client = new PhosraClient()
      const result = await client.notary.verify({ receipt })
      console.log(JSON.stringify(result, null, 2))
      process.exit(result.valid ? 0 : 1)
    }
    case "conformance": {
      const { runConformance } = await import("@phosra/conformance")
      // delegate parsing to the @phosra/conformance CLI
      console.error("Use: npx @phosra/conformance --endpoint=URL --tier=...")
      void runConformance
      process.exit(0)
    }
    case "types": {
      console.error("types generation runs from the spec repo — see sdk-typescript/packages/types/scripts/generate.mjs")
      process.exit(0)
    }
    default:
      console.error("phosra CLI — usage:")
      console.error("  phosra verify <receipt.json>")
      console.error("  phosra conformance run --endpoint=URL --tier=N")
      console.error("  phosra types generate")
      process.exit(2)
  }
}

main().catch((err) => {
  console.error("phosra:", err)
  process.exit(1)
})
