import * as ed25519 from "@noble/ed25519"
import type { Verdict, Receipt } from "@phosra/types"
import { canonicalizeBuffer } from "./canonicalize.js"

export interface NotarySigner {
  keyId: string
  /** 32-byte ed25519 private key. */
  privateKey: Uint8Array
  implementer?: string
}

export interface NotaryVerifier {
  /** Resolve a registry key_id to its public key. */
  resolveKey: (keyId: string) => Promise<Uint8Array | null>
  /** Optional: re-execute the underlying Verdict for replay verification. */
  replay?: (receipt: Receipt) => Promise<Verdict | null>
}

/**
 * Sign a Verdict to produce a Notary Receipt. See PCSS §10.2.
 *
 * The Receipt body is canonicalized via JCS with the PCSS domain
 * separator, then signed with ed25519 over the canonical bytes.
 */
export async function notarySign(verdict: Verdict, signer: NotarySigner): Promise<Receipt> {
  const issuedAt = new Date()
  const expiresAt = new Date(issuedAt)
  expiresAt.setFullYear(expiresAt.getFullYear() + 7)

  const body: Omit<Receipt, "signature"> = {
    receipt_id: ntryId(verdict.verdict_id),
    verdict,
    bearing_id: verdict.bearing_id,
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    spec: "PCSS-v1.0",
    ...(signer.implementer ? { implementer: signer.implementer } : {}),
  }

  const message = canonicalizeBuffer(body)
  const signatureBytes = await ed25519.signAsync(message, signer.privateKey)

  return {
    ...body,
    signature: {
      alg: "ed25519",
      value: base64urlEncode(signatureBytes),
      key_id: signer.keyId,
    },
  }
}

/**
 * Verify a Notary Receipt. See PCSS §10.3.
 *
 * Returns `{ valid, replays }`:
 *   - `valid`: signature verifies + receipt is within its expiration window
 *   - `replays`: re-executing the underlying Lens evaluation produces the
 *     same Verdict (only checked if `verifier.replay` is provided)
 */
export async function notaryVerify(
  receipt: Receipt,
  verifier: NotaryVerifier,
): Promise<{ valid: boolean; replays: boolean }> {
  // Signature verification
  const publicKey = await verifier.resolveKey(receipt.signature.key_id)
  if (!publicKey) return { valid: false, replays: false }

  const { signature, ...body } = receipt
  const message = canonicalizeBuffer(body)
  const sigBytes = base64urlDecode(signature.value)
  const sigValid = await ed25519.verifyAsync(sigBytes, message, publicKey)
  if (!sigValid) return { valid: false, replays: false }

  // Expiration check
  if (receipt.expires_at && new Date(receipt.expires_at) < new Date()) {
    return { valid: false, replays: false }
  }

  // Optional replay
  let replays = false
  if (verifier.replay) {
    const replayed = await verifier.replay(receipt)
    replays = !!replayed && replayed.allow === receipt.verdict.allow && replayed.reason === receipt.verdict.reason
  }

  return { valid: true, replays }
}

function ntryId(seed: string): string {
  const stamp = Date.now().toString(36)
  const hashTail = seed.slice(-8)
  return `ntry_${stamp}${hashTail}`.padEnd(20, "0").slice(0, 30)
}

function base64urlEncode(bytes: Uint8Array): string {
  let bin = ""
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64urlDecode(s: string): Uint8Array {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (s.length % 4)) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
