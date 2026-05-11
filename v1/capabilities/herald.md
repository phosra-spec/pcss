# §7 Herald — notifications and reports

> **Capability owner:** Verdict-Herald Working Group (chair TBA). **Schema:** [`v1/schema/herald.json`](../schema/herald.json). **Normative spec section:** [`pcss-v1.0.md §7`](../pcss-v1.0.md#§7-herald).

Herald is the out-of-band notification layer. Every enforcement decision (§9) and consent-state change (§5) produces events; Herald routes them to the parties who need to see them: parents, regulators, and accredited civil-society auditors.

## §7.0 Role

Herald is structurally simple — a multi-surface event envelope with strong batching rules — but conceptually load-bearing: it is the surface where PCSS makes itself accountable. A regulator's ability to detect a non-conformant implementer rests on Herald's regulator stream. A parent's awareness of what their child encountered rests on the parent surface. A civil-society researcher's ability to detect platform-wide patterns rests on the civil-society stream.

## §7.1 Wire format walkthrough

```json
{
  "herald_id": "hrld_01HXZBBBBBBBBBBBBBBBBBBBBB",
  "surface": "regulator",
  "cadence": "immediate",
  "events": [
    {
      "event_type": "verdict:block",
      "occurred_at": "2026-05-11T17:59:55Z",
      "receipt_id": "ntry_01HXZA0R5MAOQST6XYU4AVDEFG",
      "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
      "summary": "Aegis block: csam"
    }
  ],
  "issued_at": "2026-05-11T18:00:00Z",
  "issuer": "platform:roblox",
  "subscriber": "regulator:us-ftc",
  "signature": {
    "alg": "ed25519",
    "value": "MEUCIQDxCaDcDeFgHiJkLmNoPqRsTuVwXyZ0123456789",
    "key_id": "platform:roblox:herald-2026-q2"
  }
}
```

A Herald envelope carries one or more events, all destined for a single surface and a single subscriber. Events reference receipts (`receipt_id`), Bearings (`bearing_id`), or consents (`consent_id`) by opaque ID; the full receipt is fetchable via Notary verify if the subscriber needs it.

## §7.2 Surfaces

Three surfaces, each with different routing, encryption, and content rules:

### Parent surface

A parental-control app, OS notification system, or email summary destined for the parent who issued the relevant Threshold consent.

- Transport carries routing metadata (which parent, which device); envelope does NOT carry parent identifying data beyond opaque routing handles.
- Every event MUST carry a `summary` field (≤280 chars), human-readable in the parent's preferred locale.
- Encryption is typically end-to-end via the parental-control app's existing channel — Herald specifies the envelope, not the transport.
- Parents MAY opt out of specific event categories; opt-out preferences are out of scope for PCSS.

### Regulator surface

A signed event stream subscribed by a registered regulator (e.g., `regulator:us-ftc`, `regulator:eu-dsc-de`, `regulator:uk-ofcom`).

- The regulator registers its public key against a `regulator:` issuer prefix in the PCSS registry.
- Events are signed by the implementer (the platform emitting them) and MAY be additionally encrypted to the regulator's public key.
- The regulator can replay any referenced receipt via `/notary/verify` for independent re-execution.
- Regulators MAY receive content references (URL, content hash) on Aegis-CSAM events under existing investigatory authorities; civil-society subscribers MUST NOT.

### Civil-society surface

A signed event stream subscribed by an accredited civil-society body (e.g., `civil-society:commonsense`, `civil-society:fosi`).

- Accreditation is granted by the Adopter Council per [GOVERNANCE.md](../../GOVERNANCE.md).
- Events arrive with the same shape as the regulator surface but with `content` references redacted and any `extensions` tagged `confidential` excluded.
- Civil-society subscribers commit to using events for research, advocacy, and protocol-conformance auditing — not for commercial enforcement, marketing, or republication of individual events.

## §7.3 Cadence

The `cadence` field declares the envelope's batching rule. Defaults:

| `cadence` | Use | Max latency |
| --- | --- | --- |
| `immediate` | Aegis hard-block events; regulator surface | 60 seconds |
| `daily` | Privacy events, Threshold revocations, Custody deletions | 24 hours |
| `weekly` | Aggregate usage, Verdict allow-rates | 7 days |
| `monthly` | Conformance attestations, trend reports | 30 days |
| `on-request` | Civil-society research feeds (pull-style) | n/a |

Caps: parent surface ≤100 events per envelope; regulator and civil-society surfaces ≤1000 events. Implementers exceeding caps MUST split into multiple envelopes.

`immediate` cadence is MUST for `aegis:csam`, `aegis:gambling-minors`, and any Aegis category with statutory real-time reporting. Other event types SHOULD use longer cadences to combat alert fatigue.

## §7.4 Event types

Canonical event types use `category:short-name` format. v1.0:

| Event type | Triggered by |
| --- | --- |
| `verdict:block` | Lens/Aegis verdict with `allow: false` |
| `verdict:allow` | Lens verdict with `allow: true` (typically aggregated, weekly cadence) |
| `threshold:granted` | New Threshold envelope issued |
| `threshold:revoked` | Threshold envelope's `revoked_at` populated |
| `bearing:rotated` | New Bearing issued for the same user (`bearing_id` changed) |
| `custody:deletion-acknowledged` | Deletion request received |
| `custody:deletion-completed` | Deletion confirmed |
| `custody:deletion-deferred` | Deletion deferred per statutory hold |
| `conformance:attested` | Implementer published a new conformance manifest |
| `conformance:revoked` | Implementer's conformance badge withdrawn |

Vendor event types use a vendor prefix: `app:bark:override-requested`, `csm:rating-updated`.

## §7.5 Privacy invariant

Herald envelopes MUST NOT carry: parent name, child name, email address, phone number, device identifier, IP address, geolocation finer than the request's `jurisdiction`, or any field derived from one of the above. Only opaque `bearing_id`, `consent_id`, and `receipt_id` references are permitted as subject identifiers.

Event-level `summary` text on the parent surface MAY include the child's first name ONLY if the transport layer separately authenticates the parent recipient and the envelope is encrypted to the parent's device.

## §7.6 Producer responsibilities

A platform emitting Herald events MUST:

1. **Determine the correct surface** for each event. Aegis-CSAM goes to regulator immediately and civil-society redacted; routine Verdict outcomes typically go to parent surface only.
2. **Batch per cadence rules.** A single envelope per surface per cadence window.
3. **Sign with the implementer's registered key.** The Herald envelope's signature is the integrity proof; subscribers reject unsigned events.
4. **Honor subscriber-specific content rules** (regulator gets content references, civil-society does not).
5. **Retry on failed delivery.** Subscribers maintain delivery endpoints; transient failures SHOULD be retried with exponential backoff. Persistent failures (>7 days) MUST be reported via a Herald event to the regulator surface naming the failing subscriber.

## §7.7 Consumer responsibilities

A Herald subscriber MUST:

1. **Verify signatures** on every envelope.
2. **Reject envelopes** whose `surface` does not match the subscriber type (regulator surface to civil-society endpoint, etc.).
3. **Acknowledge delivery** via an out-of-band acknowledgement endpoint or transport-level ACK.
4. **Honor cadence expectations** — a regulator does not need 10 envelopes per second from one platform; alert fatigue defeats the audit goal.

## §7.8 Edge cases

- **Parent unreachable.** The implementer SHOULD retain unhand-delivered parent-surface events for a reasonable window (7 days default) and surface them via the parental-control app's existing in-app inbox.
- **Regulator endpoint down.** Implementers MUST queue events and replay; if the queue exceeds 30 days, escalate to the foundation's incident channel.
- **Notification storm.** A platform discovering a CSAM hash match on a popular meme could trigger thousands of immediate-cadence events. Implementers MAY collapse such storms into a single "category:csam-cluster" event with an `extensions.cluster_size` field; the underlying receipts remain individually retrievable.
- **Language/locale routing.** Parent-surface `summary` MUST be in the parent's locale where known; defaults to the Bearing's `jurisdiction` primary language otherwise.

## §7.9 Interop

| Capability | Interaction |
| --- | --- |
| Verdict (§9) | Every Verdict CAN be heralded; high-impact verdicts (Aegis, default-deny chains) MUST be. |
| Notary (§10) | Heralded verdicts reference Notary receipts by ID. |
| Bearing (§3) | Herald MUST NOT contain Bearing envelope contents, only `bearing_id`. |
| Threshold (§5) | Threshold grants/revocations herald to parent and regulator surfaces. |
| Custody (§8) | Deletion lifecycle herald'd on all three surfaces. |

## §7.10 Implementer checklist

- [ ] Implemented Herald emission per [`v1/openapi.yaml`](../openapi.yaml).
- [ ] Routed events to the correct surface (parent/regulator/civil-society).
- [ ] Batched per cadence rules; immediate for Aegis, otherwise SHOULD batch.
- [ ] Signed every envelope.
- [ ] Validated PII invariant — no parent name, child name, email, phone, device ID, IP, fine-grained geolocation.
- [ ] Built a delivery-failure escalation path.

## §7.11 Statute mappings

| Statute | Herald relevance |
| --- | --- |
| CA-AADC §22675(a)(5) | Parental notification of significant data-use changes. |
| KOSA §6 | Transparency reports — Herald regulator stream is the data source. |
| EU DSA Art. 24, 42 | Transparency reporting + risk assessment evidence. |
| COPPA §312.6 | Parental access rights — parent surface is the runtime surface. |
| 18 U.S.C. §2258A | CSAM CyberTipline reporting — Aegis-CSAM Herald immediate cadence is the wire path. |

## §7.12 Common mistakes

1. **PII in `summary`.** Parent-surface summaries often include the child's name and event details; the spec permits the first name ONLY under encrypted transport.
2. **Missing the immediate cadence for Aegis.** Batching a CSAM hash match into a daily summary defeats the entire purpose.
3. **No replay capability on the regulator surface.** A Herald event references `receipt_id`, but if the implementer has lost the underlying receipt, the regulator cannot replay. Receipts MUST be retained per §8.1.
4. **Civil-society receiving raw content.** Civil-society subscribers get redacted events; only regulators get content references.
5. **No delivery acknowledgement.** A platform that sends events into the void cannot prove it complied; subscribers MUST ack and implementers MUST retry.
