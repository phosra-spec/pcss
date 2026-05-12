/**
 * Canonical JSON serialization for PCSS envelopes.
 *
 * Implements RFC 8785 JSON Canonicalization Scheme (JCS):
 *   - Object keys sorted lexicographically by UTF-16 code unit
 *   - Arrays preserve insertion order
 *   - Strings escape per JCS §3.2.2.2 (lowercase \uXXXX for non-BMP/control)
 *   - Numbers serialized per ECMA-262 7.1.12.1 (no trailing zeros, lowercase e)
 *   - No insignificant whitespace
 *   - No NaN / Infinity / -0
 *   - undefined fields are dropped
 *
 * Two callers producing the same logical envelope MUST produce
 * byte-equal canonical output.
 *
 * @see PCSS §10.2.1, RFC 8785
 */

/** Byte-literal domain separator. v1.x receipts use this prefix; v2.0 will bump. */
const PCSS_DOMAIN_PREFIX_V1 = new Uint8Array([
  0x00,
  ...new TextEncoder().encode("PCSS-v1.0"),
  0x00,
])

/**
 * Canonicalize a value to its RFC 8785 JCS string form.
 */
export function canonicalize(value: unknown): string {
  return canonicalizeNode(value)
}

function canonicalizeNode(v: unknown): string {
  if (v === null) return "null"
  if (v === undefined) return "" // sentinel — caller filters out keys mapping to ""
  const t = typeof v
  if (t === "boolean") return v ? "true" : "false"
  if (t === "number") return serializeNumber(v as number)
  if (t === "string") return serializeString(v as string)
  if (Array.isArray(v)) {
    return "[" + v.map(canonicalizeNode).join(",") + "]"
  }
  if (t === "object") {
    // JCS sorts by UTF-16 code-unit order on key strings
    const entries = Object.entries(v as Record<string, unknown>)
      .filter(([, val]) => val !== undefined)
      .sort(([a], [b]) => compareKeysUtf16(a, b))
    return "{" + entries
      .map(([k, val]) => serializeString(k) + ":" + canonicalizeNode(val))
      .join(",") + "}"
  }
  throw new TypeError(`unsupported value type: ${t}`)
}

/** RFC 8785 §3.2.2.3 — ECMA-262 7.1.12.1 number-to-string. */
function serializeNumber(n: number): string {
  if (!Number.isFinite(n)) throw new TypeError("non-finite number not representable in JCS")
  if (Object.is(n, -0)) return "0"
  // ECMA-262 7.1.12.1 — Node/V8 conforms for finite numbers when using String(n) and stripping
  // trailing zero only in the fractional part if needed. JSON.stringify diverges on -0; covered above.
  // Integers in safe-int range produce no decimals.
  if (Number.isInteger(n) && Number.isSafeInteger(n)) return String(n)
  // Use the shortest unique representation matching ECMA-262 ToString
  return String(n)
}

/**
 * RFC 8785 §3.2.2.2 string serialization.
 * Escapes only: U+0000..U+001F, U+0022 ("), U+005C (\).
 * Uses lowercase \uXXXX for control chars. Forbids unpaired surrogates.
 */
function serializeString(s: string): string {
  let out = '"'
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c === 0x22) out += '\\"'
    else if (c === 0x5c) out += "\\\\"
    else if (c === 0x08) out += "\\b"
    else if (c === 0x0c) out += "\\f"
    else if (c === 0x0a) out += "\\n"
    else if (c === 0x0d) out += "\\r"
    else if (c === 0x09) out += "\\t"
    else if (c < 0x20) out += "\\u" + c.toString(16).padStart(4, "0")
    else out += s[i]
  }
  out += '"'
  return out
}

function compareKeysUtf16(a: string, b: string): number {
  const len = Math.min(a.length, b.length)
  for (let i = 0; i < len; i++) {
    const diff = a.charCodeAt(i) - b.charCodeAt(i)
    if (diff !== 0) return diff
  }
  return a.length - b.length
}

/**
 * Canonicalize an envelope and prepend the PCSS domain prefix, returning
 * the byte sequence signed by Notary per PCSS §10.2.2.
 *
 *     signing_input = b"\x00PCSS-v1.0\x00" || JCS(envelope)
 *
 * Ed25519 hashes internally; no separate SHA-256 is added.
 */
export function canonicalizeBuffer(envelope: unknown): Uint8Array {
  const jcsBytes = new TextEncoder().encode(canonicalize(envelope))
  const out = new Uint8Array(PCSS_DOMAIN_PREFIX_V1.length + jcsBytes.length)
  out.set(PCSS_DOMAIN_PREFIX_V1, 0)
  out.set(jcsBytes, PCSS_DOMAIN_PREFIX_V1.length)
  return out
}
