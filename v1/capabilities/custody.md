# §8 Custody — data minimization and deletion

> **Capability owner:** Threshold-Custody Working Group (chair TBA). **Schema:** [`v1/schema/custody.json`](../schema/custody.json). **Normative spec section:** [`pcss-v1.0.md §8`](../pcss-v1.0.md#§8-custody).

Custody is the only capability that says "no data" rather than "what data." It carries retention declarations, deletion requests, deletion-completion confirmations, and parent-initiated exports.

## §8.0 Role

Every other PCSS capability emits data: a Bearing carries an age signal, a Verdict carries a decision, a Receipt carries proof. Custody is the inverse — it specifies *when data must go away*, *under what conditions retention is overridden*, and *how deletion propagates*. It is the spec's structural answer to "what about the right to be forgotten?"

## §8.1 Wire format walkthrough

A `retention-declaration` envelope declaring that the implementer commits not to retain PCSS data beyond a window:

```json
{
  "custody_id": "cstd_01HXZCCCCCCCCCCCCCCCCCCCCC",
  "action": "retention-declaration",
  "subject_ref": { "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE" },
  "scope": ["all"],
  "retention_until": "2026-11-07T00:00:00Z",
  "issued_at": "2026-05-11T18:00:00Z",
  "issuer": "platform:roblox",
  "jurisdiction": "US-CA",
  "signature": {
    "alg": "ed25519",
    "value": "MEUCIQDxDaCcDeFgHiJkLmNoPqRsTuVwXyZ0123456789",
    "key_id": "platform:roblox:custody-2026-q2"
  }
}
```

A `deletion-request` envelope from a parent revoking all data via Threshold:

```json
{
  "custody_id": "cstd_01HXZCDDDDDDDDDDDDDDDDDDDD",
  "action": "deletion-request",
  "subject_ref": { "consent_id": "thsh_01HXZ8AAAAAAAAAAAAAAAAAAA" },
  "scope": ["all"],
  "propagation_deadline": "2026-06-10T00:00:00Z",
  "issued_at": "2026-05-11T18:00:00Z",
  "issuer": "app:bark",
  "signature": { "...": "..." }
}
```

A `deletion-completion` envelope confirming execution:

```json
{
  "custody_id": "cstd_01HXZCEEEEEEEEEEEEEEEEEEEE",
  "action": "deletion-completion",
  "subject_ref": { "consent_id": "thsh_01HXZ8AAAAAAAAAAAAAAAAAAA" },
  "scope": ["all"],
  "completion_receipt": {
    "deleted_at": "2026-05-18T03:14:00Z",
    "downstream_consumers": ["platform:roblox", "controls:nextdns"],
    "tombstone_id": "tomb_01HXZCFFFFFFFFFFFFFFFFFFFF"
  },
  "issued_at": "2026-05-18T03:14:30Z",
  "issuer": "platform:roblox",
  "signature": { "...": "..." }
}
```

## §8.2 Retention math

Default retention: **180 days from `issued_at`** for any PCSS-related data. The implementer MUST declare retention via a `retention-declaration` envelope and MUST delete on schedule.

Statutory overrides (longer retention permitted with citation in `statutory_basis`):

| Statute | Window | Why |
| --- | --- | --- |
| `18 U.S.C. §2258A` | 90 days minimum from notification | NCMEC CSAM evidence preservation |
| `26 U.S.C. §6001` | 7 years | Tax-records retention for spend events |
| `KOSA §6` | 7 years | Transparency audit records |
| `EU DSA Art. 14` | 6 months from event | Transparency database evidence |
| `state breach-notification laws` | Variable | Per state — Illinois PIPA, Connecticut, etc. |

Worked example: a minor turns 18. Their Threshold envelopes auto-expire (§5). Their Verdict receipts retain their declared retention (typically 180 days post-evaluation). Their Aegis-CSAM receipts (if any) retain at 90-day NCMEC preservation. The implementer's `retention_until` for each category honors the longest applicable rule.

## §8.3 Deletion propagation

A `deletion-request` envelope from a parent or user starts a propagation chain:

```
parent issues deletion-request
        │
        ▼
implementer acknowledges within 24h
   (Herald event: custody:deletion-acknowledged)
        │
        ▼
implementer propagates to downstream consumers (≤30 days)
   (each downstream emits its own deletion-completion or -deferred)
        │
        ▼
implementer executes deletion (≤30 days from request)
        │
        ▼
implementer emits deletion-completion with tombstone_id
   (Herald event: custody:deletion-completed)
```

Tombstone records retain only the fact that deletion occurred — no underlying data. Tombstones SHOULD be retained for audit purposes for at least the deleted data's statutory retention window.

## §8.4 Export

Per COPPA §312.6(a)(3) and GDPR Art. 15, parents may request a machine-readable export of their child's PCSS-related data. Export is expressed as an `export-request` envelope; the implementer responds with an `export-completion` envelope plus the actual data delivered via a separate secure channel (typically a signed URL valid for 72 hours).

Export covers PCSS envelopes only (Bearings, Thresholds, Verdicts, Receipts). Platform-native data (account, content, social graph) is governed by the implementer's privacy policy.

## §8.5 Producer responsibilities

A platform implementing Custody MUST:

1. **Enforce TTL on every category.** Cron-style sweeps, TTL-aware indexes, or event-driven deletion are all acceptable; never-deleted data is a conformance failure.
2. **Emit `deletion-completion` envelopes** for every deletion event, whether triggered by request or by retention TTL.
3. **Propagate to sub-processors.** Cloud providers, analytics vendors, sub-platforms — any party that received PCSS data MUST be on the `downstream_consumers` array.
4. **Honor statutory holds.** A pending CSAM investigation overrides deletion; the implementer MUST emit `custody:deletion-deferred` with the statutory citation.
5. **Maintain tombstone records** for at least the deleted data's retention window.

## §8.6 Consumer responsibilities (sub-processors)

A downstream consumer (a sub-processor that holds PCSS data) MUST:

1. **Subscribe to upstream deletion events.** The Herald regulator surface or a Custody-specific webhook.
2. **Execute deletion within the propagation deadline.**
3. **Emit a deletion-completion envelope** confirming local execution.
4. **Refuse to retain copies** in unstructured stores (logs, backups, cold storage) that the deletion sweep doesn't reach. If your infrastructure can't honor deletion fully, you're not a viable PCSS consumer.

## §8.7 Lifecycle

```
data collected ──► retention TTL starts ──► retention window active
                                                    │
                       ┌────────────────────────────┼────────────────┐
                       ▼                            ▼                ▼
              (retention reached)        (parent requests delete)  (statutory hold lifted)
                       │                            │                │
                       ▼                            ▼                ▼
                soft-deleted              soft-deleted           soft-deleted
                       │                            │                │
                       └────────────────────────────┴────────────────┘
                                              │
                                              ▼
                                      hard-deleted
                                  (tombstone retained)
```

## §8.8 Edge cases

- **Pending investigation overrides deletion.** Active law-enforcement preservation orders, NCMEC evidence retention, regulatory investigations. Implementer MUST emit `custody:deletion-deferred` with the citation; the parent MUST be notified.
- **Parent revokes then re-grants consent.** The pre-revocation data was scheduled for deletion; the re-grant is a fresh consent and creates fresh data. The implementer MUST NOT resurrect deleted records.
- **Multi-region storage.** A platform with data in US-East-1 and EU-Central-1 MUST propagate deletion across regions. EU GDPR Art. 17 deadlines run from the request, not from the request's arrival in the EU region.
- **Statutory hold conflicts with right-to-erasure.** GDPR Art. 17(3)(b) permits retention for legal claims; the implementer cites the basis and defers.

## §8.9 Interop

| Capability | Interaction |
| --- | --- |
| Bearing (§3) | Bearing rotation triggers Custody deletion of envelopes bound to the rotated `bearing_id`. |
| Threshold (§5) | Threshold revocation triggers Custody deletion of consent-scoped data. |
| Aegis (§6) | Aegis-CSAM evidence is preserved per statutory hold; Custody respects the override. |
| Herald (§7) | Custody lifecycle events herald'd on all three surfaces. |
| Notary (§10) | Receipts are PCSS-related data subject to retention windows; long-lived receipts (7-year regulatory replay) cite statutory basis. |

## §8.10 Implementer checklist

- [ ] Declared retention windows for every PCSS data category via `retention-declaration` envelopes.
- [ ] Implemented TTL enforcement on every category.
- [ ] Acknowledged deletion requests within 24 hours via Herald.
- [ ] Propagated deletion to all sub-processors within 30 days.
- [ ] Emitted `deletion-completion` envelopes on completion, with `tombstone_id` and `downstream_consumers`.
- [ ] Honored statutory holds with `custody:deletion-deferred` and citation.
- [ ] Provided an export endpoint for parent-initiated requests.

## §8.11 Statute mappings

| Statute | Custody relevance |
| --- | --- |
| COPPA §312.10 | Retention and deletion of children's personal information. |
| GDPR Art. 17 | Right to erasure ("right to be forgotten"). |
| CA-AADC §22677 | Data minimization, retention only as long as necessary. |
| UK Children's Code §11 | Data minimization for children. |
| 18 U.S.C. §2258A | CSAM preservation override (90 days post-notification). |

## §8.12 Common mistakes

1. **Retaining "for analytics."** PCSS-related data has a retention TTL; aggregating into analytics is permitted only if the aggregates are de-identified before TTL expires.
2. **Missing sub-processor propagation.** Implementer deletes their own copy, never tells their CDN/analytics vendor/BigQuery export, retention drift persists at the sub-processor.
3. **Deleting Aegis-CSAM evidence under user request.** Statutory hold preempts deletion; you defer with citation, not delete.
4. **No audit trail of deletions.** Tombstones are mandatory; "we deleted it, trust us" is not a conformance posture.
5. **Soft delete only.** Soft-deleted data still exists; hard delete is the contract. Soft delete is a transitional state, not a destination.
