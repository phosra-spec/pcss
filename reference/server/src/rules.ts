/**
 * Load PCSS rules from the v1/rules/ directory at startup.
 */

import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import type { Rule } from "@phosra/types"

export function loadRules(dir: string): Rule[] {
  const files = readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "README.md")
  const rules: Rule[] = []
  for (const file of files) {
    try {
      const content = JSON.parse(readFileSync(join(dir, file), "utf8"))
      // Skip non-rule JSON files (e.g., aggregated indexes if any).
      if (content && typeof content.slug === "string" && typeof content.capability === "string") {
        rules.push(content as Rule)
      }
    } catch (err) {
      console.error(`[ref-server] skipping ${file}: ${String(err)}`)
    }
  }
  return rules
}
