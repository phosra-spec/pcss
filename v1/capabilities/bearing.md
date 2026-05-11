# §3 Bearing — the canonical age signal

> **Capability owner:** Bearing/Identity Working Group (chair TBA). **Schema:** [`v1/schema/bearing.json`](../schema/bearing.json). **Normative spec section:** [`pcss-v1.0.md §3`](../pcss-v1.0.md#§3-bearing).

Bearing is the "true north" against which Lens, Threshold, Aegis, and the other runtime capabilities evaluate. It is the only place in PCSS where an age signal exists; everything else consumes it.

## §3.0 Role

A Bearing is an opaque, signed envelope asserting that a user belongs to a coarse age band (`0-5`, `6-9`, `10-12`, `13-15`, `16-17`, `adult`). Bearings are issued by **Bearing Providers** — OS makers, account-level platforms, or third-party verifiers — and consumed by every other PCSS capability. PCSS never transmits raw birth date.

## §3.1 Wire format walkthrough

A canonical Bearing envelope:

```json
{
  "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
  "age_band": "10-12",
  "confidence": "attested",
  "issued_at": "2026-05-01T12:00:00Z",
  "expires_at": "2027-05-01T12:00:00Z",
  "issuer": "os:apple",
  "jurisdiction": "US-CA",
  "signature": {
    "alg": "ed25519",
    "value": "MEUCIQDx1aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789AbCdEfGhIjKlMnOpQrStUvWxYz",
    "key_id": "os:apple:bearing-2026-q2"
  }
}
```

Annotations:

- `bearing_id` carries the `brng_` prefix and 16–128 characters of unpadded base32-friendly opaque ID. It MUST be opaque to consumers; no information about the user, device, or account may be derivable. ULID is the recommended generation method.
- `age_band` is one of six bands. Consumers MUST NOT request a more granular age; producers MUST NOT supply one.
- `confidence` is `attested` (VPC-grade verification), `inferred` (behavioral or account signals), or `unverified` (no positive establishment).
- `issuer` is namespaced: `os:`, `account:`, `verifier:`, `civil-society:`. The registry resolves each prefix to a set of accepted issuers.
- `signature.value` is over the canonical JSON form of the envelope with the `signature` block excluded.

## §3.2 Age-band semantics

PCSS uses bands, not exact ages, for three reasons: (1) coarseness defeats fingerprinting; (2) regulatory regimes vary on the under/over boundaries, so a band-shaped vocabulary lets a single Bearing satisfy multiple statutes; (3) granular ages would force consumers to handle birthdays as a state change every Lens evaluation.

| Band | Default statutory regime |
| --- | --- |
| `0-5` | COPPA + CA-AADC + UK Children's Code; usage typically supervised, not autonomous |
| `6-9` | COPPA + CA-AADC; first independent device usage |
| `10-12` | COPPA + CA-AADC + KOSA (when enacted); pre-teen tier — the strictest contested band |
| `13-15` | KOSA + CA-AADC + EU DSA Art. 28; COPPA no longer applies but most state AADCs do |
| `16-17` | KOSA + EU DSA + UK OSA s. 11–12; near-adult but minor under federal definitions |
| `adult` | Default rules; no minor-specific Aegis triggers |

A consumer that lacks a Bearing MUST treat the user as the most-protected unknown — typically `13-15` with `confidence: unverified` — unless the surface has its own statutory regime (e.g., pornography sites use `adult` default with §12-grade age assurance).

## §3.3 Confidence levels

`confidence` is the load-bearing input to whether a downstream rule applies. The three values:

- **`attested`** — A verifying party (parent via VPC, government-ID match, OS-level Family Sharing) has positively established the age. Required for COPPA-grade actions. Default expiration: 365 days.
- **`inferred`** — Age inferred from behavioral signals, ML estimation, or account history. Sufficient for most rules but NOT for COPPA VPC. Default expiration: 90 days.
- **`unverified`** — User self-declared at signup with no verification. Default expiration: 30 days; treated as `13-15` for rule application unless the surface has a stricter floor.

A Bearing's `confidence` MUST NOT be upgraded by a downstream consumer; only the issuing provider can re-issue at a higher level after additional verification.

## §3.4 Producer responsibilities

A Bearing Provider MUST:

1. **Sign every emitted envelope** with its registered ed25519 key. Software keystores are accepted for v1.0; OS-level providers SHOULD use hardware secure enclaves (see [`security.md §13`](../security.md#§13-bearing-producer-os-requirements)).
2. **Register its issuer identifier and public key** in the PCSS registry. Rotation events MUST be published.
3. **Re-issue expired envelopes** without losing the underlying age attestation. The new envelope SHOULD reuse the same `bearing_id` (subject to v1.1 pairwise-pseudonym work) or supply a re-issuance receipt linking old to new.
4. **Refuse to derive an age signal** from data not authorized by the parent (e.g., scraping device-level analytics).

A Bearing Provider MUST NOT:

- Transmit raw birth date or exact age.
- Transmit any PII (name, email, device identifier).
- Use the same `bearing_id` across two different users.

## §3.5 Consumer responsibilities

A Bearing Consumer MUST:

1. **Verify the signature** against the issuer's registered public key, fetched from the PCSS registry. A Bearing whose signature fails verification MUST be treated per §3.4.1 (degraded transport) → default-deny.
2. **Check expiration** against `issued_at`/`expires_at`. Expired Bearings MUST be treated as absent.
3. **Apply the stricter jurisdictional rule** when the Bearing's `jurisdiction` differs from the request's per §4.3.
4. **Never re-derive** an alternate age signal where a valid Bearing is present.

A Bearing Consumer SHOULD log signature-verification failures to Herald regulator surface for fraud detection.

## §3.6 Lifecycle

```
issued ──► active ──► (refresh) ──► active' ──► ...
   │                                     │
   ▼                                     ▼
 (rotation event)                    (expiration)
   │                                     │
   ▼                                     ▼
new bearing_id                       inactive
```

State transitions:

- **issued → active:** envelope is signed and emitted; signature passes verification.
- **active → refresh:** provider re-signs the same `bearing_id` with a new `issued_at` and `expires_at`. Allowed at any time before expiration.
- **active → rotation:** provider issues a new envelope with a new `bearing_id` (typically on account-recovery or parental request). Old `bearing_id` is invalidated; revocation propagates per §5.3.
- **active → inactive:** envelope reaches `expires_at` without refresh. Consumers MUST treat as absent.

## §3.7 Edge cases

### Degraded transport (§3.4.1)

If the consumer cannot resolve the issuer's key, treat the Bearing as absent and default-deny per §4.2. Do not attempt to validate against a cached older key — that's the entire trust regression we're avoiding.

### Cross-jurisdictional Bearings (§3.4.2)

A Bearing issued in EU presented in CA: the consumer applies BOTH jurisdictions' rule sets and the stricter combined outcome per §4.3.5 (worked example).

### Multiple competing Bearings

If a consumer receives two Bearings for the same user from different issuers (e.g., `os:apple` and `account:roblox`), the consumer SHOULD prefer the OS-level Bearing per the trust hierarchy in §3.2. If the OS-level Bearing has lower `confidence` than the account-level, the implementer MAY use the account-level Bearing but MUST emit a Herald event of type `bearing:trust_inversion` for civil-society review.

### Age-up transitions

A user crosses a band boundary (turns 13, 16, or 18). The Bearing Provider MUST issue a new envelope with the updated band. Consumers MUST NOT cache age bands past the Bearing's `expires_at`. Consents bound to the old band's rule set SHOULD be re-confirmed per §5.

## §3.8 Interop with other capabilities

| Capability | Interaction |
| --- | --- |
| Lens (§4) | Every Lens evaluation requires a valid Bearing; the request body carries the Bearing envelope. |
| Threshold (§5) | Threshold consent is bound to a `bearing_id`; revoking the Bearing invalidates the consent. |
| Aegis (§6) | Aegis categories that target a specific age band consult the Bearing. |
| Herald (§7) | Herald events reference Bearings by opaque `bearing_id` only — never the envelope. |
| Verdict (§9) | Every Verdict carries `bearing_id`; the original Bearing envelope is replayable from the registry. |
| Notary (§10) | Receipts wrap Verdicts that carry `bearing_id`; the Bearing itself is not embedded. |

## §3.9 Implementer checklist

A Bearing Provider implementer:

- [ ] Generated an ed25519 keypair; registered the public key in the PCSS registry under your issuer prefix.
- [ ] Implemented `/bearing/identify` per [`v1/openapi.yaml`](../openapi.yaml).
- [ ] Signed every emitted envelope; signature verifies against the registered key.
- [ ] Honored expiration; re-issued on refresh; rotated on parent request.
- [ ] Published rotation events in the registry.
- [ ] Filed annual transparency report (Bearings issued by band, revocations, rotations).

A Bearing Consumer implementer:

- [ ] Fetches the issuer's public key from the registry; verifies signatures.
- [ ] Default-denies on missing / expired / unresolved Bearing.
- [ ] Applies stricter-jurisdiction merge per §4.3 when relevant.
- [ ] Never derives an alternate age signal in the presence of a valid Bearing.
- [ ] Logs signature failures to Herald regulator surface.

## §3.10 Statute mappings

| Statute | Bearing relevance |
| --- | --- |
| COPPA §312.5 | `confidence: attested` is semantically equivalent to a VPC-compliant consent. |
| CA AB 1043 | Effective 2027-01-01: platforms MUST accept and honor OS-level Bearings from Apple, Google, Samsung, Microsoft. |
| KOSA §4(b) | Triggered for any `age_band` ≤ `16-17`. |
| EU GDPR Art. 8 | Parental consent required for `age_band` ≤ `13-15` (member states may lower to 13). |
| UK OSA s. 12 | "Highly effective age assurance" is the regulatory test for `confidence: attested`. |
| AU OSA amendment 2024 | Social media services MUST verify age at signup; `confidence: attested` required for `age_band` < `16-17`. |

## §3.11 Common mistakes

1. **Leaking PII via `extensions`.** Custom fields MUST carry a vendor prefix AND MUST NOT contain PII. Reviewers reject envelopes with `extensions.email`, `extensions.phone`, etc.
2. **Reusing `bearing_id` across users.** Schema enforces opacity; producers MUST NOT use deterministic IDs (e.g., `brng_sha256_of_email`) that allow correlation.
3. **Accepting expired signatures.** Cached Bearings beyond `expires_at` MUST be treated as absent — not "best available."
4. **Deriving an alternate band from analytics.** If a valid Bearing says `13-15`, you cannot use device-fingerprint signals to "correct" it to `10-12`.
5. **Skipping the registry lookup.** Hard-coding issuer public keys breaks rotation. The registry is the trust root for a reason.
