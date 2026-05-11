# §5 Threshold — parental consent

> **Capability owner:** Threshold-Custody Working Group (chair TBA). **Schema:** [`v1/schema/threshold.json`](../schema/threshold.json). **Normative spec section:** [`pcss-v1.0.md §5`](../pcss-v1.0.md#§5-threshold).

Threshold is the gate through which a parent's choice enters the network. Every COPPA-grade action, every per-scope permission grant, every revocation flows through this capability.

## §5.0 Role

Threshold encodes a parent's affirmative decision: "I, the verified parent of this child, grant this platform permission to do these specific things." It is the only capability in PCSS where the *parent* is the producer; every other capability has an OS, platform, or auditor producing envelopes.

## §5.1 Wire format walkthrough

```json
{
  "consent_id": "thsh_01HXZ8AAAAAAAAAAAAAAAAAAA",
  "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
  "granted_scope": ["dm:friends-only", "purchases:requires-approval", "feed:no-recommender"],
  "vpc": true,
  "vpc_method": "credit-card-plus-one",
  "issued_at": "2026-05-01T12:00:00Z",
  "expires_at": "2027-05-01T12:00:00Z",
  "issuer": "app:bark",
  "jurisdiction": "US-CA",
  "signature": {
    "alg": "ed25519",
    "value": "MEUCIQDxBaCcDeFgHiJkLmNoPqRsTuVwXyZ0123456789",
    "key_id": "app:bark:threshold-2026-q2"
  }
}
```

A Threshold envelope binds a `consent_id` to a `bearing_id` (the child whose age signal grounds the consent). The `issuer` is the entity that captured the parent's consent — a parental-control app like Bark, an OS Family flow like Apple Family Sharing, or a platform's own parent UI.

## §5.2 Scope grammar

`granted_scope` is the load-bearing field. Canonical scopes use `surface:value` shape:

| Scope | Meaning |
| --- | --- |
| `dm:off` | Direct messages disabled entirely |
| `dm:friends-only` | DMs accepted only from friended accounts |
| `dm:supervised` | DMs delivered but parent receives a copy via Herald |
| `purchases:off` | No spend, full stop |
| `purchases:requires-approval` | Parent approves every transaction out-of-band |
| `purchases:capped:5USD-per-day` | Spending cap; vendor extension for amount syntax |
| `feed:no-recommender` | Chronological feed only |
| `feed:no-autoplay` | Autoplay disabled |
| `chatbot:off` | AI conversational surfaces disabled |
| `chatbot:tier-1-only` | Per CSM 4-tier AI rating; only Tier-1 chatbots permitted |
| `livestream:off` | Live stream surfaces disabled |
| `livestream:audience-only` | User can watch but not broadcast |
| `data-export:on` | Parent has activated portability rights |
| `analytics:off` | No behavioral analytics on this child |

Vendor scopes use a vendor prefix: `apple:icloud-photos:family-only`, `csm:rating-tier:moderate-only`. Vendor scopes MUST NOT redefine canonical scope semantics.

## §5.3 VPC methods

When `vpc: true`, `vpc_method` declares which COPPA §312.5-compliant method was used:

| `vpc_method` | Description |
| --- | --- |
| `credit-card-plus-one` | Credit card transaction with a small charge (typically $0.50) |
| `knowledge-based-authentication` | KBA questions answered against credit-bureau data |
| `signed-form` | Mailed or faxed signed consent form |
| `government-id-match` | Government-issued ID verification |
| `video-conference` | Live video review of the parent and their ID |
| `facial-age-estimation` | Facial age estimation (per FTC's 2025 amended Rule) |
| `third-party-verifier` | Delegated to a registered verifier (Yoti, Veriff, IDology) with their own attestation |

Each method maps to specific COPPA Rule §312.5(b) procedures. Implementers SHOULD retain the underlying VPC artifact (signed form, video recording, KBA log) for audit purposes per §8 retention rules.

## §5.4 Producer responsibilities

The Threshold issuer (typically a parental-control app or platform's parent UI) MUST:

1. **Capture the parent's consent affirmatively.** Pre-checked boxes, dark patterns, or scope-bundling that obscures individual grants are conformance failures and likely violations of FTC Act §5.
2. **Bind the consent to a specific Bearing.** A Threshold envelope is meaningful only for one child; multi-child consents MUST be emitted as separate envelopes.
3. **Sign the envelope** with the issuer's registered key. Software keystores are acceptable for v1.0; v1.1 will mandate HSM/enclave for VPC-bearing issuers.
4. **Disclose the scope grammar.** The parent UI MUST list every scope being granted in human-readable language; the envelope's `granted_scope` array MUST exactly match what the parent saw.
5. **Honor revocation in real-time.** When a parent revokes a scope, the issuer MUST emit a new envelope with `revoked_at` populated and propagate per §5.5.

## §5.5 Consumer responsibilities and revocation

Threshold consumers (platforms and Lens evaluators) MUST:

1. **Verify the signature** against the issuer's registered key.
2. **Check the bearing binding.** A Threshold envelope is valid only for the child whose `bearing_id` it references.
3. **Honor the freshness window.** §5.3 of the spec: revocations propagate within 7 days for VPC consents and 30 days for unverified. Consumers MUST poll or subscribe to the issuer's revocation feed within that window.
4. **Default-deny on missing consent.** If a rule requires VPC and no valid Threshold envelope exists, the consumer MUST default-deny per Lens §4.2.
5. **Never expand granted scope.** A Threshold envelope grants exactly what it grants; consumers MAY NOT infer adjacent permissions.

## §5.6 Lifecycle

```
parent UI grants scope ──► envelope signed ──► consent active
                                                    │
                       ┌────────────────────────────┼────────────────┐
                       ▼                            ▼                ▼
                 (parent revokes)             (envelope expires)  (bearing rotates)
                       │                            │                │
                       ▼                            ▼                ▼
              revoked_at populated         re-issuance required  envelope invalid
                       │                            │
                       ▼                            ▼
              consumer propagation        new envelope issued
                  (7-30 days)
```

A Threshold envelope's lifecycle is bound to the underlying Bearing — when the Bearing rotates (new `bearing_id`), every Threshold consent SHOULD be re-issued against the new Bearing.

## §5.7 Edge cases

- **Separated-parent disagreement.** Two parents with conflicting Threshold envelopes for the same child. Default rule: the more restrictive consent wins. Custody-of-the-child legal questions are out of scope for PCSS; the spec applies the protection-first heuristic.
- **Age-up transitions.** When a child crosses an age band (especially crossing to `adult`), Thresholds bound to minor-specific scopes MUST auto-expire. The issuer SHOULD prompt the now-adult user to confirm or revoke each remaining scope.
- **Guardian transfer.** A parent's death, divorce, or relinquished guardianship transfers Threshold authority to the new guardian. The new guardian MUST issue fresh Threshold envelopes under their own `issuer` identifier; the previous Threshold envelopes SHOULD be invalidated with a `bearing:rotated` Herald event.
- **Jurisdictional VPC disparity.** A US parent's COPPA-compliant VPC may not satisfy GDPR Art. 8 in the EU. Implementers serving cross-jurisdictional users MUST verify the consent satisfies the *strictest* applicable jurisdiction.

## §5.8 Interop

| Capability | Interaction |
| --- | --- |
| Bearing (§3) | Threshold binds to a `bearing_id`; Bearing rotation invalidates the consent. |
| Lens (§4) | Lens consults active Thresholds when evaluating consent-gated rules. |
| Aegis (§6) | Aegis verdicts cannot be overridden by Threshold; consent to CSAM is not consent the parent can give. |
| Herald (§7) | Threshold grants and revocations herald to the parent and regulator surfaces. |
| Custody (§8) | Threshold revocation triggers deletion of consent-scoped data per §8.2. |
| Notary (§10) | Threshold consents SHOULD be Notary-signed for regulator replay. |

## §5.9 Implementer checklist

- [ ] Implemented `/threshold/check` per [`v1/openapi.yaml`](../openapi.yaml).
- [ ] Generated an ed25519 keypair; registered under your `issuer:` prefix.
- [ ] Built a parent-facing UI that maps to the canonical scope grammar.
- [ ] Documented your VPC method(s) and retained the underlying artifacts.
- [ ] Wired revocation to propagate within the §5.3 freshness window.
- [ ] Signed every emitted envelope.
- [ ] Never combined consents from two parents into a single envelope.

## §5.10 Statute mappings

| Statute | Threshold relevance |
| --- | --- |
| COPPA §312.5 | The entire VPC framework. `vpc: true` is semantically equivalent to a §312.5-compliant consent record. |
| COPPA §312.6 | Parental access and revocation rights — the basis for our revocation propagation. |
| GDPR Art. 8 | Parental authorization for users under 16 (member states may lower to 13). |
| CA-AADC §22675(a)(7) | Per-scope toggle requirements — our canonical scope grammar maps directly. |
| UK Age-Appropriate Design Code | The 15 standards including high-privacy defaults; our scope grammar must accommodate. |
| EU DSA Art. 28 | Consent-gated targeted advertising to minors. |

## §5.11 Common mistakes

1. **Caching a revoked consent.** Once revoked, a Threshold envelope MUST NOT be honored past the freshness window. Caching layers that miss revocations are a privacy failure.
2. **Conflating attested Bearing with VPC.** An `attested` Bearing means the *age* is verified; it does not mean *consent* is granted. VPC is a separate step.
3. **Applying US VPC methods to EU subjects.** COPPA's `credit-card-plus-one` is COPPA-valid but not necessarily GDPR-valid; check jurisdictional fit.
4. **Bundling scopes opaquely.** A "consent to everything" toggle is not COPPA-compliant. The parent must see what they're granting.
5. **Treating revocation as a delete event.** Revocation halts future use of the consent but does NOT trigger Custody deletion unless the parent issues a separate `deletion-request` envelope.
