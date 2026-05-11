/**
 * PCSS Implementer Example — minimal Lens + Notary server.
 *
 * This example shows the *supply side*: an adopter who implements the
 * PCSS surface themselves rather than calling a hosted reference. Most
 * platform adopters (TikTok, Roblox, Snap, Discord, etc.) will run their
 * own Lens and Notary so that bearings never leave their trust boundary.
 *
 * See:
 *   - Spec:    ../../v1/pcss-v1.0.md
 *   - OpenAPI: ../../v1/openapi.yaml
 *   - Schemas: ../../v1/schema/
 */

import { createHash } from "node:crypto"
import { sign, generateKeyPairSync } from "node:crypto"
import type { Bearing, Verdict, Receipt } from "@phosra/types"

// In production, key material is held in an HSM or KMS. Here we generate
// a session key for demonstration only. Key rotation is required at least
// annually per PCSS §10.4.
const { privateKey, publicKey } = generateKeyPairSync("ed25519")
const keyId = "implementer-demo-2026-q2"

/**
 * Canonicalize a JSON object per the EIP-712-style ordering described in
 * PCSS §10.2: sort object keys lexicographically; arrays preserve order;
 * UTF-8 encode the result. The canonical form is what we sign.
 */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value)
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]"
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b))
  return "{" + entries.map(([k, v]) => JSON.stringify(k) + ":" + canonicalize(v)).join(",") + "}"
}

/**
 * Evaluate a Bearing against the implementer's rule registry.
 * Real implementations consult /registry/rules; this stub hardcodes the
 * KOSA + CA-AADC recommender rule.
 */
export function lensEvaluate(args: {
  bearing: Bearing
  surface: string
  capability: string
  jurisdiction: string
}): Verdict {
  const minorBands = new Set(["0-5", "6-9", "10-12"])
  const isMinor = minorBands.has(args.bearing.age_band)
  const isRecommender = args.capability === "recommender"

  if (isMinor && isRecommender) {
    return {
      verdict_id: "vrd_" + createHash("sha256").update(canonicalize(args)).digest("hex").slice(0, 24),
      allow: false,
      reason: "lens:recommender_off_minor",
      cited: ["KOSA-§4(b)(2)", "CA-AADC-§22675(a)(2)-(4)"],
      bearing_id: args.bearing.bearing_id,
      evaluated_at: new Date().toISOString(),
      explanation:
        "Algorithmic recommender feeds are disabled for users under 13 per " +
        "KOSA and CA AADC. The user's age band is " +
        args.bearing.age_band +
        ", jurisdiction " +
        args.jurisdiction +
        ".",
      capability: "lens",
      surface: args.surface,
      jurisdictions: [args.jurisdiction],
    }
  }

  return {
    verdict_id: "vrd_" + createHash("sha256").update(canonicalize(args)).digest("hex").slice(0, 24),
    allow: true,
    reason: "lens:no_applicable_rule",
    cited: [],
    bearing_id: args.bearing.bearing_id,
    evaluated_at: new Date().toISOString(),
    capability: "lens",
    surface: args.surface,
    jurisdictions: [args.jurisdiction],
  }
}

/**
 * Notary.sign — sign a verdict to produce a regulator-replayable receipt.
 * Per PCSS §10, the signature covers the canonicalized verdict plus the
 * receipt envelope (excluding the signature field itself).
 */
export function notarySign(verdict: Verdict): Receipt {
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + 7) // §8 default retention

  const receiptCore = {
    receipt_id: "ntry_" + createHash("sha256").update(verdict.verdict_id).digest("hex").slice(0, 24),
    verdict,
    bearing_id: verdict.bearing_id,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    spec: "PCSS-v1.0",
    implementer: "example-adopter",
  }

  const canonical = canonicalize(receiptCore)
  const sig = sign(null, Buffer.from(canonical, "utf8"), privateKey)

  return {
    ...receiptCore,
    signature: {
      alg: "ed25519",
      value: sig.toString("base64url"),
      key_id: keyId,
    },
  }
}

// ─── demo ────────────────────────────────────────────────────────────────
if (process.argv[1]?.endsWith("implementer.ts")) {
  const bearing: Bearing = {
    bearing_id: "brng_018d4cb13f5a7e2c9b1d0a6e",
    age_band: "10-12",
    confidence: "attested",
    issued_at: new Date().toISOString(),
    issuer: "os:apple",
    jurisdiction: "US-CA",
    signature: { alg: "ed25519", value: "...", key_id: "apple-2026-q2" },
  }

  const verdict = lensEvaluate({
    bearing,
    surface: "feed-rank",
    capability: "recommender",
    jurisdiction: "US-CA",
  })

  const receipt = notarySign(verdict)

  console.log(JSON.stringify({ verdict, receipt }, null, 2))
  console.log("\nPublic key (for verifier):")
  console.log(publicKey.export({ type: "spki", format: "pem" }).toString())
}
