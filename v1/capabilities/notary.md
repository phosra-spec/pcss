# §10 Notary — signed receipts

> **Capability owner:** Notary/Cryptography Working Group (chair TBA). **Schema:** [`v1/schema/receipt.json`](../schema/receipt.json). **Normative spec section:** [`pcss-v1.0.md §10`](../pcss-v1.0.md#§10-notary).

Notary wraps every enforcement decision in a regulator-ready signed envelope. It is the linchpin of PCSS's transparency claim: without Notary, every Verdict is hearsay; with it, every decision is independently replayable years later.

## §10.0 Role

Every Lens evaluation (§4), Threshold consent check (§5), and Aegis block (§6) produces a Verdict (§9). Notary signs that Verdict to produce a Receipt — a portable, replayable, non-PII envelope that a regulator, civil-society auditor, or downstream researcher can independently verify.

The trust model is structural, not policy-based: the receipt is signed by the implementer's registered key; the underlying Bearing-and-rule-registry state lets anyone re-execute the Verdict and confirm it matches. PCSS doesn't ask you to trust the implementer; it gives you the math to check.

## §10.1 Wire format walkthrough

A canonical Receipt envelope:

```json
{
  "receipt_id": "ntry_01HXZA0R5MAOQST6XYU4AVDEFG",
  "verdict": {
    "verdict_id": "vrd_01HXYZ9Q4L9NPRS5WXT3ZUCDEF",
    "allow": false,
    "reason": "lens:recommender_off_minor",
    "cited": ["KOSA-§4(b)(2)", "CA-AADC-§22675(a)(3)"],
    "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
    "evaluated_at": "2026-05-11T18:00:00Z",
    "explanation": "Recommender feeds are disabled for users in age band 10-12 under California AADC and KOSA.",
    "capability": "lens",
    "jurisdictions": ["US-CA", "US"]
  },
  "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
  "issued_at": "2026-05-11T18:00:01Z",
  "expires_at": "2033-05-11T18:00:01Z",
  "spec": "PCSS-v1.0",
  "signature": {
    "alg": "ed25519",
    "value": "QmVlcEJvb3BUaGlzSXNBVmFsaWRCYXNlNjRVcmxFbmNvZGVkRWQyNTUxOVNpZ25hdHVyZQ",
    "key_id": "platform:example:notary-2026-q2",
    "timestamp_authority": "tsa.phosra-spec.org"
  },
  "implementer": "platform:example"
}
```

## §10.2 Signing protocol

### §10.2.1 Canonicalization

The receipt body (everything except the `signature` block) is canonicalized via EIP-712-style typed-data canonicalization adapted for non-Ethereum contexts. The domain separator is:

```
domain = {
  name: "PCSS",
  version: "1.0",
  verifyingAuthority: "phosra-spec.org/registry"
}
```

Fields are serialized in declared order matching the JSON Schema; nested objects are recursively canonicalized. The result is hashed with SHA-256, then signed with ed25519 over the hash.

### §10.2.2 Algorithm

v1.0 mandates ed25519. Rationale: compact (64-byte signature, 32-byte public key), fast (sub-millisecond sign/verify on commodity hardware), library-ubiquitous, patent-free.

v1.1 will add a hybrid signature suite (ed25519 + ML-DSA / FIPS 204) for post-quantum readiness — see [`security.md §10`](../security.md#§10-quantum-considerations).

### §10.2.3 Key registration

Notary signers MUST publish their public key in the PCSS registry under an `implementer:` prefix. The registry resolves `key_id = "platform:example:notary-2026-q2"` to the corresponding ed25519 public key, the issuance timestamp, and (if revoked) the revocation timestamp.

## §10.3 Verification protocol

A regulator, civil-society body, or any third party verifies a Receipt in three steps:

1. **Signature verification.** Fetch the public key from the PCSS registry using `signature.key_id`. Recompute the canonical typed-data form. Verify the ed25519 signature.
2. **Validity window.** Check `issued_at` is within the key's valid window. Check `expires_at` is not in the past.
3. **Replay.** Re-execute the underlying Lens/Threshold/Aegis evaluation against the original Bearing (resolved by `verdict.bearing_id`) and confirm the same Verdict is produced.

The `/notary/verify` endpoint returns `{ valid: boolean, replays: boolean }`. `valid` is signature + window; `replays` is semantic equality after re-execution. Tier-1 implementers SHOULD return both flags; Tier-2 implementers MUST.

## §10.4 Key management

Notary signers MUST:

- **Rotate annually** at minimum. Tier-1 implementers SHOULD rotate every 90 days; Tier-2 MUST.
- **Publish rotation events** to the registry with the new public key and the rotation timestamp.
- **Retain rotated public keys** for the validity window of any receipt signed under that key (default 7 years).
- **Use hardware key storage** (HSM, secure enclave) for any production Notary key — software keystores are accepted for v1.0 dev only.

On compromise: the implementer MUST publish a revocation record to the registry within 24 hours. Consumers reject receipts whose `issued_at` exceeds the key's `last_known_good_at` (forthcoming in v1.1 — see [`security.md §4`](../security.md#§4-key-compromise-and-rotation)).

## §10.5 Privacy invariant

Receipts MUST NOT carry PII. The opaque `bearing_id` and `verdict_id` are the only subject-shaped identifiers permitted. The Bearing envelope referenced by `bearing_id` itself carries only `age_band` and `jurisdiction` — no birth date, no real name, no device identifier.

This is the structural answer to "what if a regulator asks for the user behind this verdict?" The data is not in the receipt; the data is not in the Bearing; the data is not in the registry. An implementer who maintains a sidecar mapping `bearing_id → user_identity` is operating outside PCSS — the spec MUST NOT be cited as the basis for such a sidecar.

## §10.6 Lifecycle

A receipt is immutable. Any post-signature modification breaks the signature and the receipt is no longer a receipt. Receipts flow from emission through retention to expiration:

```
verdict emitted ──► notary signed ──► receipt published
                                            │
                                            ▼
                       ┌────────────────────┼────────────────────┐
                       ▼                    ▼                    ▼
                regulator stream    civil-society stream    audit log
                (immediate)          (cadence per §7.2)   (180 days per §8.1)
```

## §10.7 Edge cases

- **Receipt outside expiration but key still valid.** Verify returns `valid: false`. The receipt is no longer admissible but its content remains historically auditable.
- **Key compromise.** Revocation in the registry; receipts whose `issued_at > last_known_good_at` are rejected.
- **Registry unavailability.** Verifiers SHOULD cache the registry; cache invalidation rules in [`security.md §4`](../security.md#§4-key-compromise-and-rotation).
- **Multi-signer receipts.** Tier-2 Custodian receipts MAY be co-signed by an independent witness (regulator or accredited civil-society body). The signature block becomes an array; verification is the union.
- **Receipt batching.** Implementers MAY emit a Merkle-root receipt covering N individual verdicts and derive per-verdict receipts on demand. The batched receipt's signature covers the root.

## §10.8 Implementer checklist

- [ ] Generated an ed25519 keypair; registered the public key under your `implementer:` prefix.
- [ ] Implemented `/notary/sign` and `/notary/verify` per [`v1/openapi.yaml`](../openapi.yaml).
- [ ] Canonicalized the receipt body before signing per §10.2.1.
- [ ] Set `expires_at` to 7+ years on regulator-surface receipts.
- [ ] Rotated keys at the cadence required for your tier.
- [ ] Published rotation events to the registry.
- [ ] Wired `/notary/sign` into the Verdict-emission path on every Lens/Threshold/Aegis evaluation.
- [ ] Verified no PII appears in any receipt field including `extensions`.

## §10.9 Statute mappings

| Statute | Notary relevance |
| --- | --- |
| EU DSA Art. 37 (independent audit) | Receipt stream is the audit evidence. |
| KOSA §6 (annual independent audit) | Receipt-stream replay satisfies the audit-evidence requirement. |
| FTC Act §5 (deception / dark patterns) | Receipts establish what was enforced when. |
| COPPA §312.6 (access to records) | Parents have right to records; receipts are records. |

## §10.10 Common mistakes

1. **`JSON.stringify` instead of canonical signing.** Implementers sometimes sign `JSON.stringify(verdict)`. This breaks verification because non-canonical serialization produces different bytes. Use the typed-data canonicalization from §10.2.1.
2. **Signing post-mutation.** Verdict is mutated after signing. The signature no longer covers the receipt content.
3. **Never rotating keys.** §10.4 mandates annual rotation; a key in production for 5 years is a Tier-1 conformance failure.
4. **Leaking key_id semantics that reveal user identity.** `key_id = "platform:example:user-12345-notary"` reveals user count and per-user keys. Use opaque versioned keys: `notary-2026-q2`, not per-user.
5. **Using a software keystore for production.** v1.0 accepts it; v1.1 will mandate HSM/enclave. Plan ahead.
6. **Embedding the full Bearing in the receipt.** The receipt should reference `bearing_id` only; embedding the Bearing duplicates state and risks leaking issuer context. The Bearing is reproducible on replay from the registry.
