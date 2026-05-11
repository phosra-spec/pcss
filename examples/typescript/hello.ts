/**
 * PCSS Hello World — Bearing → Lens → Notary
 *
 * Demonstrates the canonical PCSS runtime flow. A user attempts to access
 * a content-recommender feed; the implementer evaluates whether the
 * algorithmic feed should be served and signs the verdict so a regulator
 * can replay it.
 *
 * See:
 *   - Spec:    ../v1/pcss-v1.0.md
 *   - OpenAPI: ../v1/openapi.yaml
 *   - Schemas: ../v1/schema/
 */

import { phosra } from "@phosra/sdk"
import type { Bearing, Verdict, Receipt } from "@phosra/types"

async function main() {
  // 1. Bearing — issue or fetch the canonical age signal.
  //    Typically the bearing comes from the OS (Apple, Google, Samsung)
  //    or from an account-level age attestation. PCSS §3.
  const bearing: Bearing = await phosra.bearing.identify({
    subject: { account_id: "acct_emma_01" },
    jurisdiction: "US-CA",
    acceptable_confidence: ["attested", "inferred"],
  })

  console.log("Bearing:")
  console.log(`  age_band   = ${bearing.age_band}`)         //   "10-12"
  console.log(`  confidence = ${bearing.confidence}`)        //   "attested"
  console.log(`  issuer     = ${bearing.issuer}`)            //   "os:apple"
  console.log(`  jurisd.    = ${bearing.jurisdiction}`)      //   "US-CA"

  // 2. Lens — evaluate which rules apply.
  //    The implementer (here: a platform's feed-rank service) passes the
  //    bearing along with the surface and capability they're evaluating.
  //    PCSS §4.
  const verdict: Verdict = await phosra.lens.evaluate({
    bearing,
    surface: "feed-rank",
    capability: "recommender",
    jurisdiction: "US-CA",
  })

  console.log("\nVerdict:")
  console.log(`  allow       = ${verdict.allow}`)            //   false
  console.log(`  reason      = ${verdict.reason}`)           //   "lens:recommender_off_minor"
  console.log(`  cited       = ${JSON.stringify(verdict.cited)}`)
  //   ["KOSA-§4(b)(2)", "CA-AADC-§22675(a)(2)-(4)"]
  console.log(`  explanation = ${verdict.explanation}`)
  //   "Algorithmic recommender feeds are disabled for users under 13 per
  //    KOSA and CA AADC. The user's age band is 10-12, jurisdiction US-CA."

  // 3. Notary — sign the verdict for regulator replay.
  //    The signed receipt is what regulators and civil-society auditors
  //    subscribe to. The bearing_id is opaque; no PII leaves the
  //    implementer. PCSS §10.
  const receipt: Receipt = await phosra.notary.sign({ verdict })

  console.log("\nReceipt:")
  console.log(`  receipt_id  = ${receipt.receipt_id}`)       //   "ntry_018d4cb13f..."
  console.log(`  signer      = ${receipt.signature.key_id}`) //   "phosra-ref-2026-q2"
  console.log(`  alg         = ${receipt.signature.alg}`)    //   "ed25519"
  console.log(`  spec        = ${receipt.spec}`)             //   "PCSS-v1.0"
  console.log(`  issued_at   = ${receipt.issued_at}`)
  console.log(`  expires_at  = ${receipt.expires_at}`)

  // The receipt is now ready for delivery to:
  //   - The regulator subscriber stream (Herald §7).
  //   - The civil-society subscriber stream (Herald §7).
  //   - The adopter's own audit log (any retention policy ≤ Custody §8).
}

main().catch((err) => {
  console.error("Phosra runtime error:", err)
  process.exit(1)
})
