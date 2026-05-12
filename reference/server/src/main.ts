/**
 * PCSS Reference Server — v0.2
 *
 * Implements the v1/openapi.yaml surface using @phosra/sdk/server for
 * canonicalization, Lens evaluation, and Notary signing.
 *
 * v0.2 changes:
 * - Real ed25519 signing on Bearings (was placeholder string)
 * - Separate signing keys for Bearing issuance vs. Notary
 * - /registry/keys/:keyId endpoint
 * - Replay-able notary.verify (reads stored Bearing from MemoryStore)
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import * as ed25519 from "@noble/ed25519"
import Fastify from "fastify"
import {
  canonicalizeBuffer,
  lensEvaluate,
  notarySign,
  notaryVerify,
} from "@phosra/sdk/server"
import type { Bearing, Verdict, Rule } from "@phosra/types"
import { loadRules } from "./rules.js"
import { MemoryStore } from "./store/memory.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 7474)
const HOST = process.env.HOST ?? "0.0.0.0"
const KEY_PATH = process.env.KEY_PATH ?? join(__dirname, "..", ".pcss-reference-key.json")
const RULES_DIR = process.env.RULES_DIR ?? join(__dirname, "..", "..", "..", "v1", "rules")
const NOTARY_KEY_ID = process.env.NOTARY_KEY_ID ?? "reference:pcss-dev:notary-2026-q2"
const BEARING_KEY_ID = process.env.BEARING_KEY_ID ?? "reference:pcss-dev:bearing-2026-q2"

interface KeyPair {
  privateKey: Uint8Array
  publicKey: Uint8Array
  keyId: string
}

// ── Key material ──────────────────────────────────────────────────────────

async function loadOrGenerateKeys(): Promise<{ bearing: KeyPair; notary: KeyPair }> {
  if (existsSync(KEY_PATH)) {
    const json = JSON.parse(readFileSync(KEY_PATH, "utf8"))
    return {
      bearing: {
        privateKey: Uint8Array.from(Buffer.from(json.bearing.privateKey, "base64")),
        publicKey: Uint8Array.from(Buffer.from(json.bearing.publicKey, "base64")),
        keyId: json.bearing.keyId,
      },
      notary: {
        privateKey: Uint8Array.from(Buffer.from(json.notary.privateKey, "base64")),
        publicKey: Uint8Array.from(Buffer.from(json.notary.publicKey, "base64")),
        keyId: json.notary.keyId,
      },
    }
  }
  const bearingPriv = ed25519.utils.randomPrivateKey()
  const bearingPub = await ed25519.getPublicKeyAsync(bearingPriv)
  const notaryPriv = ed25519.utils.randomPrivateKey()
  const notaryPub = await ed25519.getPublicKeyAsync(notaryPriv)

  writeFileSync(
    KEY_PATH,
    JSON.stringify(
      {
        bearing: {
          keyId: BEARING_KEY_ID,
          privateKey: Buffer.from(bearingPriv).toString("base64"),
          publicKey: Buffer.from(bearingPub).toString("base64"),
        },
        notary: {
          keyId: NOTARY_KEY_ID,
          privateKey: Buffer.from(notaryPriv).toString("base64"),
          publicKey: Buffer.from(notaryPub).toString("base64"),
        },
        generated_at: new Date().toISOString(),
      },
      null,
      2,
    ),
  )
  console.error(`[ref-server] generated keys:`)
  console.error(`  ${BEARING_KEY_ID}  pub=${Buffer.from(bearingPub).toString("base64url")}`)
  console.error(`  ${NOTARY_KEY_ID}   pub=${Buffer.from(notaryPub).toString("base64url")}`)

  return {
    bearing: { privateKey: bearingPriv, publicKey: bearingPub, keyId: BEARING_KEY_ID },
    notary: { privateKey: notaryPriv, publicKey: notaryPub, keyId: NOTARY_KEY_ID },
  }
}

// Sign a Bearing envelope with the reference's bearing key, using the same
// JCS + domain-prefix canonicalization as Notary (§10.2.1).
async function signBearing(
  body: Omit<Bearing, "signature">,
  signer: KeyPair,
): Promise<Bearing> {
  const message = canonicalizeBuffer(body)
  const sigBytes = await ed25519.signAsync(message, signer.privateKey)
  return {
    ...body,
    signature: {
      alg: "ed25519",
      value: Buffer.from(sigBytes).toString("base64url"),
      key_id: signer.keyId,
    },
  }
}

// ── Server ────────────────────────────────────────────────────────────────

async function main() {
  const keys = await loadOrGenerateKeys()
  const rules: Rule[] = loadRules(RULES_DIR)
  const store = new MemoryStore()
  const fastify = Fastify({ logger: { level: process.env.LOG_LEVEL ?? "info" } })

  console.error(`[ref-server] loaded ${rules.length} rules from ${RULES_DIR}`)

  // POST /v1/bearing/identify ─ issues a properly-signed Bearing.
  // A real Bearing Provider lives behind the OS; this reference signs with
  // the reference's bearing key so adopters have something to verify against.
  fastify.post("/v1/bearing/identify", async (req, reply) => {
    const body = req.body as { subject?: { account_id?: string }; jurisdiction?: string }
    const accountId = body?.subject?.account_id ?? "anonymous"

    const bearing = await signBearing(
      {
        bearing_id: stableBrng(accountId),
        age_band: inferAgeBand(accountId),
        confidence: "unverified",
        issued_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        issuer: "reference:pcss-dev",
        jurisdiction: body?.jurisdiction ?? "US",
      },
      keys.bearing,
    )

    store.putBearing(bearing)
    return reply.send(bearing)
  })

  // POST /v1/lens/evaluate ─ the real meat
  fastify.post("/v1/lens/evaluate", async (req, reply) => {
    const body = req.body as {
      bearing?: Bearing
      surface?: string
      capability?: string
      jurisdiction?: string
    }
    if (!body?.bearing || !body?.surface || !body?.capability) {
      return reply.code(422).send({ error: "bearing, surface, capability required" })
    }
    const verdict = lensEvaluate({
      bearing: body.bearing,
      surface: body.surface,
      capability: body.capability,
      jurisdiction: body.jurisdiction ?? body.bearing.jurisdiction,
      rules,
    })
    return reply.send(verdict)
  })

  // POST /v1/threshold/check
  fastify.post("/v1/threshold/check", async (req, reply) => {
    const body = req.body as { bearing?: Bearing; scope?: string }
    if (!body?.bearing || !body?.scope) {
      return reply.code(422).send({ error: "bearing and scope required" })
    }
    // Stub: no consents stored → default-deny with VPC required for under-13.
    const isUnder13 = ["0-5", "6-9", "10-12"].includes(body.bearing.age_band)
    const verdict: Verdict = {
      verdict_id: `vrd_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
      allow: false,
      reason: isUnder13 ? "threshold:vpc_required" : "threshold:consent_missing",
      cited: isUnder13 ? ["COPPA-§312.5"] : [],
      bearing_id: body.bearing.bearing_id,
      evaluated_at: new Date().toISOString(),
      surface: body.scope,
      capability: "threshold",
      jurisdictions: [body.bearing.jurisdiction],
    }
    return reply.send(verdict)
  })

  // POST /v1/aegis/check
  fastify.post("/v1/aegis/check", async (req, reply) => {
    const body = req.body as { bearing?: Bearing; category?: string }
    if (!body?.bearing || !body?.category) {
      return reply.code(422).send({ error: "bearing and category required" })
    }
    const aegisStatute: Record<string, string[]> = {
      csam: ["18-U.S.C.-§2258A"],
      "gambling-minors": ["UIGEA"],
      "dark-patterns": ["FTC-Act-§5"],
      "age-inappropriate-monetization": ["KOSA-§4(b)(4)"],
    }
    const verdict: Verdict = {
      verdict_id: `vrd_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`,
      allow: false,
      reason: `aegis:${body.category}`,
      cited: aegisStatute[body.category] ?? [],
      bearing_id: body.bearing.bearing_id,
      evaluated_at: new Date().toISOString(),
      capability: "aegis",
      jurisdictions: [body.bearing.jurisdiction],
    }
    return reply.send(verdict)
  })

  // POST /v1/notary/sign
  fastify.post("/v1/notary/sign", async (req, reply) => {
    const body = req.body as { verdict?: Verdict }
    if (!body?.verdict) return reply.code(422).send({ error: "verdict required" })
    const receipt = await notarySign(body.verdict, {
      keyId: keys.notary.keyId,
      privateKey: keys.notary.privateKey,
      implementer: "reference:pcss-dev",
    })
    store.putReceipt(receipt)
    return reply.send(receipt)
  })

  // POST /v1/notary/verify
  fastify.post("/v1/notary/verify", async (req, reply) => {
    const body = req.body as { receipt?: Record<string, unknown> }
    if (!body?.receipt) return reply.code(422).send({ error: "receipt required" })
    const result = await notaryVerify(body.receipt as Parameters<typeof notaryVerify>[0], {
      resolveKey: async (kid) => {
        if (kid === keys.notary.keyId) return keys.notary.publicKey
        if (kid === keys.bearing.keyId) return keys.bearing.publicKey
        return null
      },
      replay: async (rcpt) => {
        const original = store.getBearing(rcpt.bearing_id)
        if (!original) return null
        return lensEvaluate({
          bearing: original,
          surface: rcpt.verdict.surface ?? "unknown",
          capability: rcpt.verdict.capability === "lens" ? "recommender" : "lens",
          jurisdiction: rcpt.verdict.jurisdictions?.[0] ?? original.jurisdiction,
          rules,
        })
      },
    })
    return reply.send(result)
  })

  // GET /v1/registry/keys/:keyId — resolve a public key for third-party verifiers.
  fastify.get("/v1/registry/keys/:keyId", async (req, reply) => {
    const { keyId } = req.params as { keyId: string }
    if (keyId === keys.notary.keyId) {
      return reply.send({
        key_id: keys.notary.keyId,
        alg: "ed25519",
        public_key: Buffer.from(keys.notary.publicKey).toString("base64url"),
        purpose: "notary",
        active: true,
      })
    }
    if (keyId === keys.bearing.keyId) {
      return reply.send({
        key_id: keys.bearing.keyId,
        alg: "ed25519",
        public_key: Buffer.from(keys.bearing.publicKey).toString("base64url"),
        purpose: "bearing-issuance",
        active: true,
      })
    }
    return reply.code(404).send({ error: "key_id not found" })
  })

  // GET /v1/registry/keys — list all keys this reference advertises.
  fastify.get("/v1/registry/keys", async (_req, reply) => {
    return reply.send([
      {
        key_id: keys.bearing.keyId,
        alg: "ed25519",
        public_key: Buffer.from(keys.bearing.publicKey).toString("base64url"),
        purpose: "bearing-issuance",
        active: true,
      },
      {
        key_id: keys.notary.keyId,
        alg: "ed25519",
        public_key: Buffer.from(keys.notary.publicKey).toString("base64url"),
        purpose: "notary",
        active: true,
      },
    ])
  })

  // GET /v1/registry/rules
  fastify.get("/v1/registry/rules", async (req, reply) => {
    const query = req.query as { capability?: string; jurisdiction?: string }
    let filtered = rules
    if (query.capability) filtered = filtered.filter((r) => r.capability === query.capability)
    if (query.jurisdiction) {
      filtered = filtered.filter((r) =>
        r.statutes.some((s) => s.jurisdiction === query.jurisdiction || query.jurisdiction!.startsWith(s.jurisdiction + "-")),
      )
    }
    return reply.send(filtered)
  })

  // GET / — service banner
  fastify.get("/", async (_req, reply) => {
    return reply.send({
      service: "PCSS Reference Server",
      spec: "PCSS-v1.0",
      keys: {
        bearing: {
          key_id: keys.bearing.keyId,
          public_key: Buffer.from(keys.bearing.publicKey).toString("base64url"),
        },
        notary: {
          key_id: keys.notary.keyId,
          public_key: Buffer.from(keys.notary.publicKey).toString("base64url"),
        },
      },
      rules_loaded: rules.length,
      registry: {
        keys_url: "/v1/registry/keys",
        rules_url: "/v1/registry/rules",
      },
      docs: "https://github.com/phosra-spec/pcss",
    })
  })

  await fastify.listen({ port: PORT, host: HOST })
  console.error(`[ref-server] listening on http://${HOST}:${PORT}`)
}

// ── Helpers ───────────────────────────────────────────────────────────────

function stableBrng(seed: string): string {
  // Deterministic-ish for dev convenience. Production replaces with ULID.
  const hash = Array.from(seed).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 0)
  return `brng_${hash.toString(36).padStart(8, "0")}${"0123456789abcdef".repeat(2)}`.slice(0, 30)
}

function inferAgeBand(accountId: string): Bearing["age_band"] {
  // Tiny heuristic for demo: account IDs containing age hints map; default 13-15.
  if (accountId.match(/0[12]yo|toddler/i)) return "0-5"
  if (accountId.match(/0[6-9]yo/i)) return "6-9"
  if (accountId.match(/1[0-2]yo/i)) return "10-12"
  if (accountId.match(/1[3-5]yo/i)) return "13-15"
  if (accountId.match(/1[67]yo/i)) return "16-17"
  if (accountId.match(/adult/i)) return "adult"
  return "13-15"
}

main().catch((err) => {
  console.error("[ref-server] fatal:", err)
  process.exit(1)
})
