/**
 * Canonical JSON serialization for PCSS envelopes.
 *
 * Implements RFC 8785-style JSON Canonicalization Scheme (JCS) with the
 * PCSS-specific domain separator for signing. Two callers serializing
 * the same logical envelope MUST produce byte-equal output.
 *
 * @see PCSS §10.2.1
 */

const PCSS_DOMAIN = Object.freeze({
  name: "PCSS",
  version: "1.0",
  verifyingAuthority: "phosra-spec.org/registry",
})

/**
 * Canonicalize a value to its JCS string form.
 * - object keys are sorted lexicographically
 * - arrays preserve order
 * - strings use JSON-stringify's escape rules
 * - undefined values are omitted (matches JCS)
 */
export function canonicalize(value: unknown): string {
  return canonicalizeNode(value)
}

function canonicalizeNode(v: unknown): string {
  if (v === null) return "null"
  if (v === undefined) return "" // sentinel — caller filters out keys mapping to ""
  const t = typeof v
  if (t === "boolean") return v ? "true" : "false"
  if (t === "number") {
    if (!Number.isFinite(v as number)) throw new TypeError("non-finite number not representable")
    return JSON.stringify(v)
  }
  if (t === "string") return JSON.stringify(v)
  if (Array.isArray(v)) {
    return "[" + v.map(canonicalizeNode).join(",") + "]"
  }
  if (t === "object") {
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return "{" + entries
      .map(([k, val]) => JSON.stringify(k) + ":" + canonicalizeNode(val))
      .join(",") + "}"
  }
  throw new TypeError(`unsupported value type: ${t}`)
}

/**
 * Canonicalize an envelope and prepend the PCSS domain separator, returning
 * the byte sequence signed by Notary. The domain separator prevents
 * cross-protocol signature reuse.
 */
export function canonicalizeBuffer(envelope: unknown): Uint8Array {
  const body = canonicalize(envelope)
  const message = canonicalize({ domain: PCSS_DOMAIN, payload: body })
  return new TextEncoder().encode(message)
}
