# Phosra Child Safety Specification

**Version:** 1.0 (public review)
**Status:** v1.0 public review · 2026-05
**License:** CC BY 4.0
**Editor:** Phosra Standards Body (transitioning to independent foundation; see [GOVERNANCE.md](../GOVERNANCE.md))

This document specifies the Phosra Child Safety Specification (PCSS), an open interoperability standard for child online safety. PCSS defines a wire format between the demand side of the child-safety network (parents, parental-control products, schools) and the supply side (platforms, OS makers, device makers, ISPs). The intent is that a parent's choice on any one node is honored on every other node in the network.

This document is informative where it explains. It is normative where it uses **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**, and **MAY**, per [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

## §1 Charter

The specification itself. Charter is the meta-document — what you are reading now.

### §1.1 Scope

PCSS specifies:

- The wire format for the canonical age signal (Bearing).
- The wire format for tier evaluation (Lens).
- The wire format for parental consent and access boundaries (Threshold).
- The wire format for non-negotiable enforcement blocks (Aegis).
- The wire format for parent and regulator notification (Herald).
- The wire format for data minimization and deletion (Custody).
- The wire format for algorithmic audit decisions (Verdict).
- The wire format for signed enforcement receipts (Notary).
- The mapping from statutes (KOSA, COPPA, CA-AADC, EU DSA, etc.) to PCSS rule categories.

PCSS does **not** specify:

- The user interfaces a parental-control product or platform exposes.
- The business model of any implementer.
- The hardware on which an implementation runs.
- The choice of identity provider, age-verification provider, or content-classification vendor.
- Internal logging or analytics on top of the spec's normative requirements.

### §1.2 Conformance

A PCSS-conformant implementation **MUST**:

- Implement one or more named capabilities listed in §3 through §10.
- Emit and consume wire envelopes that validate against the JSON Schemas in `v1/schema/`.
- Pass the conformance test cases applicable to its declared capabilities (see [`v1/conformance/`](conformance/)).
- Sign every enforcement decision via the Notary capability (§10) if claiming Tier-A Charter Adopter status.

A PCSS-conformant implementation **SHOULD**:

- Implement at least five capabilities to qualify for Charter Adopter status.
- Publish a public conformance report annually.

A PCSS-conformant implementation **MAY**:

- Extend the rule registry with implementer-specific rules, provided those rules carry a vendor prefix and do not redefine PCSS-canonical rule slugs.
- Use a custom transport (HTTPS, WebTransport, gRPC) as long as the envelope contents are byte-equivalent to the canonical JSON form.

### §1.3 Versioning

PCSS follows semantic versioning adapted for protocols:

- **Patch (vX.Y.Z):** typo fixes, clarifying examples, additional non-normative explanation. Adopters need not re-implement.
- **Minor (vX.Y.0):** new capabilities, new rule categories, new jurisdictions. Backwards-compatible. Adopters opt in.
- **Major (vX.0.0):** breaking changes. Requires a 90-day public review and Adopter Council ratification. Adopters have one minor version to migrate.

### §1.4 License

This document is licensed under [Creative Commons Attribution 4.0 International](https://creativecommons.org/licenses/by/4.0/). You may copy, redistribute, adapt, and use the specification for any purpose — including commercial — provided you give appropriate credit, link to the license, and indicate if changes were made.

## §2 Premise

PCSS exists because every operator of a service that touches a minor — every platform, every parental-control product, every OS, every ISP — is being asked to implement the same compliance requirements against the same statutes, in incompatible ways. The result is fragmentation: a parent's choice on one app does not propagate to another, regulators receive non-comparable evidence, and platforms ship parallel implementations of the same legal requirement.

PCSS proposes that the wire format between these actors be a published, versioned, signed open specification.

PCSS does not propose:

- That any one organization should define what "age-appropriate" means.
- That parental controls should replace child agency.
- That a child's online experience should be tracked across services beyond what is needed to honor a parental choice.
- That the spec replace civil-society standards bodies (FOSI, ESRB, ISO TC 218); rather, PCSS consumes their ratings via Lens (§4).

## §3 Bearing — the canonical age signal

Bearing is the canonical age signal for a user. It is the "true north" against which Lens, Threshold, Aegis, and the other runtime capabilities evaluate.

### §3.1 Wire format

A Bearing envelope **MUST** conform to [`v1/schema/bearing.json`](schema/bearing.json). The envelope includes:

- `bearing_id`: a stable, opaque identifier issued by the Bearing Provider.
- `age_band`: one of `0-5`, `6-9`, `10-12`, `13-15`, `16-17`, `adult`. PCSS does not transmit exact ages.
- `confidence`: one of `attested`, `inferred`, `unverified`. Attested means the parent or guardian has provided verifiable parental consent (VPC) per COPPA §312.5 or equivalent.
- `issued_at`: ISO 8601 timestamp.
- `issuer`: the Bearing Provider's identifier (e.g., `os:apple`, `os:google`, `account:platform-name`, `verifier:third-party-name`).
- `jurisdiction`: ISO 3166 country code + optional sub-region (e.g., `US-CA`).
- `signature`: ed25519 signature over the canonical envelope.

### §3.2 Bearing Providers

A Bearing Provider is an entity that issues age signals. PCSS recognizes:

- **OS-level providers** — Apple, Google, Microsoft, Samsung. These are the canonical source. AB 1043 in California already requires OS makers to expose age signals at account creation; PCSS extends this to a portable envelope.
- **Account-level providers** — platforms with their own age-of-account state (e.g., Roblox account age, YouTube age-gate). These are second-best.
- **Third-party verifiers** — Yoti, IDology, Veriff. These are typically invoked when statutory requirements (e.g., COPPA's VPC) cannot be satisfied by OS or account-level signals.

A Bearing Provider **MUST**:

- Sign every emitted envelope with its registered ed25519 key.
- Re-issue envelopes that have expired (per `confidence`, expiration varies: 30 days for `unverified`, 365 days for `attested`).
- Publish its issuer identifier and public key in the PCSS registry.

A Bearing Provider **MUST NOT**:

- Transmit raw birth date.
- Transmit any personally identifying information about the user beyond the `bearing_id` (which is opaque).
- Re-derive an age signal from data not authorized by the parent.

### §3.3 Bearing Consumers

A Bearing Consumer **MUST NOT** derive an alternative age signal where a valid bearing is already present, except in the case of §3.4.1 (degraded transport).

A Bearing Consumer **MUST** verify the envelope signature against the issuer's registered key.

A Bearing Consumer **MUST** treat envelopes with `confidence: unverified` as the weakest signal and apply jurisdictional default rules for unknown age users.

### §3.4 Edge cases

#### §3.4.1 Degraded transport

If a downstream Lens implementation receives a bearing whose signature has expired or whose issuer cannot be resolved, the implementation **MUST** treat the bearing as absent and apply the jurisdictional default per §4.2 (Lens default-deny).

#### §3.4.2 Cross-jurisdictional bearings

Where a bearing was issued under a different jurisdiction than the current request, the consumer **MUST** apply the stricter of the two jurisdictional rule sets, per §4.3 (Lens conflict resolution).

#### §3.4.3 Bearing rotation

A user **MUST** be able to rotate their bearing (e.g., reset to a new opaque `bearing_id`) without losing the underlying age attestation. Implementers **SHOULD** support rotation at minimum on account-deletion + recreation flow.

## §4 Lens — tier gating

Lens evaluates "what rule applies?" for a given (Bearing, Surface, Jurisdiction) triple and returns a Verdict. Lens is the multi-dimensional tier-gating layer: a single Lens evaluation can cover content classification, privacy posture, and AI/algorithmic exposure.

### §4.1 Wire format

A Lens request envelope **MUST** include:

- `bearing`: the Bearing envelope (§3).
- `surface`: a registered surface identifier (e.g., `feed-rank`, `dm-inbound`, `purchase-flow`).
- `jurisdiction`: the request jurisdiction.
- `capability`: the consumer capability (`recommender`, `messaging`, `commerce`, `content-feed`, `chatbot`, etc.).

A Lens response is a Verdict envelope (see §9).

### §4.2 Default-deny

When Lens cannot resolve a verdict (missing bearing, unknown surface, expired signature, unresolved issuer key, network error, ambiguous conflict per §4.3), the implementation **MUST** return a Verdict envelope with `allow: false`, `reason: "lens:default_deny"`, and the applicable jurisdictional default in the `cited` array. The HTTP transport binding **MUST** return this Verdict with status `200`; status `422` is reserved for envelopes that are syntactically malformed (do not validate against the JSON Schema) — in which case no Verdict is produced and the implementer **MUST NOT** allow the action.

Default-deny is the cornerstone of PCSS safety: an implementer that cannot answer the question allows nothing, ever. It is **MUST NOT** acceptable to fail open under any circumstance, including service degradation, partial outages, or budget-driven rate-limiting.

### §4.3 Conflict resolution

When two or more jurisdictional rule sets apply to a single Lens evaluation — for example, a request originating in California from a user with a Bearing issued by an EU provider — Lens **MUST** evaluate all applicable rule sets and apply the strictest combined outcome. The Verdict's `jurisdictions` array **MUST** list every jurisdiction whose rules contributed.

#### §4.3.1 What "applicable" means

A rule set is **applicable** to an evaluation if any of the following are true:

- The request `jurisdiction` matches the rule's `jurisdiction` field (exact match or hierarchical: `US` matches `US-CA`).
- The Bearing `jurisdiction` matches the rule's `jurisdiction` field (same hierarchical rule).
- The Bearing's `issuer` is registered as operating under the rule's jurisdiction (e.g., `os:apple` is registered as operating under both `US` and `EU`).
- The Bearing's `age_band` falls within the rule's `applies_to_ages` array.

A rule whose `applies_to_ages` excludes the current Bearing's `age_band` is **not applicable** and **MUST NOT** be considered, even if its jurisdiction matches.

#### §4.3.2 The stricter-rule order

PCSS defines a partial order over rule outcomes. Outcomes are compared per-rule, then composed:

1. `deny` > `warn` > `allow`. A `deny` outcome from any applicable rule wins over any combination of `warn` and `allow`.
2. Within `deny`: a rule that denies a strict superset of actions wins. A rule that denies *all* recommender surfaces is stricter than a rule that denies only *personalized-by-affinity* recommender surfaces.
3. Within `warn`: identical merging — the longest combined explanation wins.
4. Within `allow`: identical merging — the union of granted scopes applies.

When two rules produce identical outcomes (same verdict, same scope) under different jurisdictions, the implementer **MUST** merge them: a single Verdict with both jurisdictions in `jurisdictions[]` and both citations in `cited[]`.

#### §4.3.3 Orthogonal-axis conflicts

Some rules disagree on axes that are not directly comparable. For example, CA-AADC §1798.99.31(a)(7) requires opt-in for behavioral advertising; EU DSA Art. 28 requires algorithmic *transparency* (an explainability disclosure). One is a consent mechanism, the other a disclosure mechanism. Neither is stricter on the other's axis.

In this case the implementer **MUST** apply both rules independently — opt-in *and* disclosure — and emit a single Verdict carrying both citations. The Verdict's `allow` field reflects the *combined* outcome: if either rule would deny under its axis, the combined Verdict denies.

#### §4.3.4 Tie-breaking

If two applicable rules produce contradictory outcomes that cannot be ordered (`deny` vs `allow` on the same scope, with no superset relationship), the implementer **MUST**:

1. Default-deny per §4.2.
2. Emit a Verdict with `reason: "lens:default_deny"` and both jurisdictions and rule slugs in `cited[]`.
3. Log a Herald `regulator` surface notification within the §7.2 immediate cadence so the conflict is visible to the relevant regulators.

A rule-registry conflict of this kind is a defect, not a runtime configuration. The Conformance Working Group **MUST** review any `lens:default_deny` Verdict citing two contradictory rules and propose an RFC to resolve the registry-level conflict.

#### §4.3.5 Worked example

A user with `bearing.age_band = "10-12"`, `bearing.jurisdiction = "EU-DE"`, `bearing.issuer = "os:apple"` requests `surface: "feed-rank"`, `capability: "recommender"`, request `jurisdiction: "US-CA"`.

Applicable rule sets:

- `us_kosa_recommender_off_minor` (jurisdiction `US`): `deny` for `age_band` ≤ 17 on `surface: feed-rank`.
- `us_ca_aadc_recommender_consent` (jurisdiction `US-CA`): `deny` unless explicit opt-in for the same surface and age band.
- `eu_dsa_minor_targeted_ad_ban` (jurisdiction `EU`): does not apply to recommender feeds per Art. 28; **not applicable**.
- `eu_gdpr_age_of_consent` (jurisdiction `EU`): does not address recommender feeds; **not applicable**.

Combined outcome: `deny` (both US rules deny). Verdict:

```json
{
  "allow": false,
  "reason": "lens:recommender_off_minor",
  "cited": ["us_kosa§4(b)(2)", "us_ca_aadc§1798.99.31(a)(3)"],
  "jurisdictions": ["US", "US-CA"]
}
```

The EU jurisdictions are **not** cited because no EU rule was applicable. The Bearing's `jurisdiction = EU-DE` brought the EU rule registry into scope for evaluation, but the evaluation concluded none of those rules applied to this request.

#### §4.3.6 Registry pinning

A Verdict produced by Lens **SHOULD** carry a `registry_version` reference (slated for v1.1 as a normative MUST). Without registry pinning, Notary replay (§10.2) is non-deterministic across rule-registry updates: a Verdict produced at time T0 against registry vN cannot be byte-equal to a re-execution at time T1 against registry vN+1. v1.0 implementers **SHOULD** record the registry version they evaluated against in the Verdict's `extensions.registry_version` field.

### §4.4 Surface registry

Lens evaluations cite a `surface` field. The canonical v1.0 surfaces are:

| Surface | Description |
| --- | --- |
| `feed-rank` | Algorithmic recommendation feeds; "what shows up when the user opens the app." |
| `dm-inbound` | Direct messages received by the user. |
| `dm-outbound` | Direct messages sent by the user. |
| `purchase-flow` | Any commerce surface where the user can spend money or commit to a purchase. |
| `chatbot` | Conversational AI interactions, including companion-style products. |
| `livestream` | Video or audio streams produced or consumed live. |
| `search` | Search query and result surfaces, including autocomplete. |
| `account-creation` | Account signup and onboarding flows. |
| `ugc-upload` | User-generated content upload and publication. |
| `notification` | Push, email, or in-product notifications. |

Implementers **MAY** register additional surfaces with a vendor prefix (e.g., `apple:appstore:rating-prompt`). Vendor-prefixed surfaces **MUST NOT** redefine the semantics of a canonical surface.

## §5 Threshold — parental consent

Threshold specifies the wire format for parental consent and access boundaries. This is the capability through which a parent's choice enters the network.

### §5.1 Wire format

A Threshold envelope **MUST** conform to [`v1/schema/threshold.json`](schema/threshold.json). The envelope includes:

- `consent_id`: stable opaque identifier.
- `bearing_id`: the Bearing envelope this consent is bound to. Consent is per-child, never global.
- `granted_scope`: a list of scopes the parent has authorized (e.g., `dm:friends-only`, `purchases:requires-approval`, `feed:no-recommender`).
- `vpc`: boolean. True if this consent satisfies COPPA §312.5 verifiable parental consent requirements.
- `vpc_method`: when `vpc: true`, identifies which §312.5 method was used (`credit-card-plus-one`, `signed-form`, `video-conference`, etc.).
- `revoked_at`: optional ISO 8601 timestamp if consent has been revoked.
- Signature, issuer, and jurisdiction fields per Bearing (§3.1).

### §5.2 Verifiable Parental Consent

Threshold envelopes that satisfy COPPA §312.5 verifiable parental consent requirements **MUST** carry `vpc: true` and reference the verification method used.

### §5.3 Revocation

A parent **MUST** be able to revoke any granted scope. Revoked envelopes **MUST** be propagated to all downstream consumers within the spec's freshness window (30 days for `unverified` consent, 7 days for `vpc: true` consent).

## §6 Aegis — hard blocks

Aegis specifies the non-negotiable block surface: CSAM, gambling for minors, dark patterns. Aegis decisions are not subject to Lens conflict resolution; they are absolute denials regardless of jurisdiction.

### §6.1 Categories

PCSS v1.0 defines these Aegis categories. The full list is maintained in the rule registry; here is the canonical baseline:

- `aegis:csam` — Child sexual abuse material detection and reporting (NCMEC, INHOPE).
- `aegis:gambling-minors` — Gambling product access for users with `age_band` below `18`.
- `aegis:dark-patterns` — Subscription dark patterns, hidden cancellation flows.
- `aegis:age-inappropriate-monetization` — Loot boxes and gambling-like mechanics for under-18 users where statutorily prohibited.

### §6.2 Aegis verdicts

Aegis verdicts are always `allow: false` with `reason: aegis:<category>` and **MUST** cite the applicable statutory or treaty basis.

## §7 Herald — notifications and reports

Herald specifies the wire format for parent, regulator, and civil-society notifications. Every enforcement decision produces a Verdict (§9); Herald routes derived events from those Verdicts to the parties that need to see them, without ever transmitting user-identifying data.

### §7.1 Surfaces

Herald notifications target three surfaces. A Herald envelope **MUST** declare its target surface in the `surface` field per [`v1/schema/herald.json`](schema/herald.json).

- **Parent surface.** A parental-control app, OS notification system, or email summary destined for the parent who issued the relevant Threshold consent. Parent-surface envelopes **MUST** include a `summary` field on every event (a human-readable single-line description, ≤280 characters). The transport layer carries the routing metadata; the envelope itself **MUST NOT** carry the parent's name, email, or device identifier.
- **Regulator surface.** A signed event stream subscribed by a registered regulator (e.g., `regulator:us-ftc`, `regulator:eu-dsc-de`, `regulator:uk-ofcom`). The regulator subscribes by registering its public key against a `regulator:` issuer prefix; events are encrypted to that key in transport and signed by the issuer. The regulator can replay any cited receipt through `/notary/verify` (§10.2).
- **Civil-society surface.** A signed event stream subscribed by an accredited civil-society body (e.g., `civil-society:commonsense`, `civil-society:fosi`). Accreditation criteria are defined by the Adopter Council; see [GOVERNANCE.md](../GOVERNANCE.md). Civil-society surfaces receive the same envelope as the regulator surface but **MUST NOT** receive event types tagged as `confidential` (e.g., active-investigation CSAM reports).

### §7.2 Cadence

Herald **SHOULD** batch notifications to avoid alert fatigue. The `cadence` field on every Herald envelope declares its batching rule. Default cadences:

- **`immediate`** — Aegis hard-block events (§6). One envelope per event, dispatched within 60 seconds of the underlying Verdict. **MUST** be used for `aegis:csam`, `aegis:gambling-minors`, and any other Aegis category whose statutory basis demands real-time reporting.
- **`daily`** — Privacy-relevant events (data access, profile change, Threshold revocation, Custody deletion). One envelope per recipient per day, batching all events from the prior 24 hours.
- **`weekly`** — Aggregate usage patterns, Verdict allow-rates, Lens evaluation throughput. One envelope per recipient per week.
- **`monthly`** — Conformance attestation summaries and trend reports.
- **`on-request`** — Pull-style subscription where the recipient polls; reserved for civil-society research feeds where realtime push would burden the consumer.

An envelope on the parent surface **MUST NOT** exceed 100 events; on the regulator and civil-society surfaces **MUST NOT** exceed 1000 events. Implementers exceeding these caps **MUST** split into multiple envelopes.

### §7.3 Accreditation

Civil-society subscribers **MUST** be accredited by the Adopter Council. Accreditation criteria, the application process, and the public registry of accredited bodies are documented in [GOVERNANCE.md](../GOVERNANCE.md). Regulators do not require accreditation; they self-attest by registering a `regulator:` issuer prefix tied to a statutory mandate.

### §7.4 Privacy invariant

Herald envelopes **MUST NOT** carry: parent name, child name, email address, phone number, device identifier, IP address, geolocation finer than the request's `jurisdiction`, or any field whose value is derived from one of the above. The opaque `bearing_id`, `consent_id`, and `receipt_id` references are the only subject-shaped identifiers permitted. Event-level summaries on the parent surface **MAY** include the child's first name only if the transport layer separately authenticates the parent recipient and the envelope is encrypted to the parent's device; in this case the implementer is treating the transport as part of the parent-surface trust boundary.

## §8 Custody — data minimization and deletion

Custody specifies the wire format for retention declarations, deletion requests, deletion-completion confirmations, and parent-initiated data exports. Every retention, deletion, or export action **MUST** be expressed as a Custody envelope per [`v1/schema/custody.json`](schema/custody.json).

### §8.1 Retention

PCSS-conformant implementations **MUST** declare a retention window for every category of PCSS-related data they hold, using a `retention-declaration` Custody envelope. The default retention window is **180 days from issued_at**; longer windows require a citation in the `statutory_basis` field (e.g., `18 U.S.C. §2258A` for CSAM evidence preservation; `26 U.S.C. §6001` for tax-records retention; `KOSA §6` for transparency-audit records).

PCSS-related data **MUST** be deleted at the end of the declared retention window, including all derived data (analytics aggregates, training corpora, sub-processor copies). The implementer **MUST** emit a `deletion-completion` Custody envelope when retention-driven deletion occurs.

The retention window applies to PCSS envelopes themselves (Bearings, Verdicts, Threshold grants, Receipts) and to any data derived from them. It does not apply to platform-native data (the user's account, content, social graph) that the implementer holds outside the PCSS layer.

### §8.2 Deletion

A user (or their parent, via a Threshold envelope) **MUST** be able to request deletion of their PCSS-related data. A deletion request is expressed as a `deletion-request` Custody envelope, signed by the parent's Threshold issuer.

The implementer **MUST**:

1. Acknowledge the deletion request within 24 hours by emitting a Herald event of type `custody:deletion-acknowledged` to the parent surface.
2. Propagate the deletion request to every downstream consumer of the affected data within 30 days. Downstream consumers are enumerated in the `completion_receipt.downstream_consumers` array.
3. Execute the deletion within 30 days of the request's `issued_at` timestamp.
4. Emit a Notary-signed `deletion-completion` Custody envelope upon completion, with `completion_receipt.deleted_at` matching the actual deletion timestamp.
5. Retain an opaque tombstone identifier (`completion_receipt.tombstone_id`) for audit purposes — the tombstone records that deletion occurred without retaining the deleted data itself.

Deletion **MAY** be deferred where a statutory hold applies (active law-enforcement preservation order, NCMEC evidence retention, ongoing regulatory investigation); the statutory basis **MUST** be cited and the parent **MUST** be notified via a Herald event of type `custody:deletion-deferred` with the cited basis.

### §8.3 Export

A parent **MAY** request export of their child's PCSS-related data using an `export-request` Custody envelope. The implementer **MUST** produce a machine-readable JSON export, schema-validated, within 30 days. The export covers PCSS envelopes only; export of platform-native data is governed by the implementer's privacy policy and applicable statute, not by PCSS.

## §8 Custody — data minimization and deletion

Custody specifies the wire format for data minimization and deletion rights.

### §8.1 Retention

PCSS-conformant implementations **MUST** retain user data for no longer than 180 days unless statutorily required to retain longer (e.g., CSAM reporting requirements).

### §8.2 Deletion

A user (or their parent, via Threshold) **MUST** be able to request deletion of their PCSS-related data. The implementation **MUST** propagate the deletion request to all downstream consumers within 30 days.

## §9 Verdict — algorithmic audit

Verdict specifies the format of enforcement decisions. Every Lens evaluation, every Threshold consent check, and every Aegis block produces a Verdict.

### §9.1 Wire format

See [`v1/schema/verdict.json`](schema/verdict.json). Required fields:

- `verdict_id`: stable opaque identifier.
- `allow`: boolean.
- `reason`: a registered reason code (e.g., `aegis:csam`, `lens:recommender_off_minor`).
- `cited`: array of statute references.
- `bearing_id`: reference to the Bearing envelope that produced this verdict.
- `evaluated_at`: ISO 8601 timestamp.
- `explanation`: human-readable explanation (used in regulator/parent notifications).

### §9.2 Explainability

PCSS-conformant implementations **MUST** provide a human-readable explanation for every Verdict on request. The explanation **MUST** include the statute basis and the Bearing characteristics (age band, jurisdiction).

## §10 Notary — signed receipts

Notary wraps every enforcement decision in a regulator-ready signed envelope. Notary is the linchpin of the spec's transparency claim.

### §10.1 Wire format

See [`v1/schema/receipt.json`](schema/receipt.json). A Receipt envelope **MUST** include:

- `receipt_id`: stable identifier.
- `verdict`: the Verdict envelope (§9).
- `bearing_id`: reference to the underlying Bearing.
- `issued_at`: ISO 8601 timestamp.
- `expires_at`: receipt validity window.
- `signature`: ed25519 signature over the canonicalized envelope (see §10.2.1).
- `signature.key_id`: the Notary's registered key identifier.

### §10.2 Canonicalization and signing

#### §10.2.1 Canonicalization

PCSS envelopes are canonicalized via **RFC 8785 JSON Canonicalization Scheme (JCS)** before signing. JCS produces a deterministic byte sequence for any JSON value: object keys sorted lexicographically by code-unit value; arrays preserve order; strings UTF-8 encoded with the JCS escape table; numbers serialized per ECMA-262 7.1.12.1; no insignificant whitespace; no `NaN` or `±Infinity`.

The `signature` field itself is **excluded** from canonicalization; everything else in the envelope is signed. Two implementations that produce JSON-equivalent envelopes MUST produce byte-equal canonical forms.

#### §10.2.2 Domain separator and signing input

To prevent cross-protocol signature reuse, the signing input is constructed by prepending a fixed byte-literal domain prefix to the JCS output:

```
signing_input  =  b"\x00PCSS-v1.0\x00"  ||  JCS(envelope_without_signature)
```

The leading NUL byte ensures the prefix is not parseable as JSON. The version string is bumped at every major version (v2.0 will use `b"\x00PCSS-v2.0\x00"`); minor and patch versions reuse v1.0's prefix to preserve signature compatibility within a major.

Ed25519 signs `signing_input` directly — ed25519 hashes internally; **no separate SHA-256 pass is added**.

Test vectors for the canonical form of each envelope type are published at [`v1/conformance/fixtures/canonicalization-vectors/`](conformance/fixtures/) and an implementation is considered Tier-2 conformant only if its canonical output matches the published byte sequences.

#### §10.2.3 Replay and verification

A regulator or civil-society body **MUST** be able to:

1. Request a receipt by `receipt_id`.
2. Verify the signature against the Notary's registered public key.
3. Re-execute the underlying Lens evaluation against the original Bearing envelope and confirm that the same Verdict is produced.

### §10.3 Key management

Notary signers **MUST** rotate keys at least annually. Rotation events **MUST** be published to the PCSS registry with the new public key and the rotation timestamp. Receipts signed with rotated keys remain valid; the registry must retain rotated public keys for the receipt's `expires_at` window.

### §10.4 Privacy

Receipts **MUST NOT** carry PII. Receipts carry `bearing_id` (opaque) and `verdict_id` (opaque) only. The underlying Bearing envelope contains only the `age_band` and `jurisdiction`; no birth date, no real name, no device identifier.

## §11 Conformance test plan

See [`v1/conformance/`](conformance/) for the full plan and fixtures. Conformance is asserted at three tiers, with strictly increasing requirements:

### §11.1 Tiered conformance

- **Tier-0 Implementer.** Reads the spec correctly. Implements at least one capability (Bearing-consumer, Lens-evaluator, Threshold-issuer, etc.). Passes Schema and Semantics test suites. Suitable for self-attestation by any builder; minimum for a registry listing.
- **Tier-1 Adopter.** Tier-0 plus Replay and Negative test suites. Implements Notary on every decision (signs every Verdict). Required for consumer-facing surfaces and for "Charter Adopter" status.
- **Tier-2 Custodian.** Tier-1 plus Privacy and Herald-subscriber tests. Implements Custody deletion propagation, regulator-surface Herald, and the Notary verify endpoint. Required for regulator-facing surfaces and to publish receipts to the conformance ledger.

### §11.2 Test categories

Each tier requires passing one or more test categories. Categories are:

1. **Schema.** Every wire envelope produced or consumed by the implementer **MUST** validate against the JSON Schema in [`v1/schema/`](schema/). The conformance runner injects deliberate schema violations and asserts that the implementer rejects them per the additionalProperties rule.
2. **Semantics.** A curated set of canonical (Bearing, surface, jurisdiction, capability) inputs **MUST** produce the expected Verdict with the expected `reason` code and `cited` array. The Phosra reference rules registry defines these expectations for the 15 priority rules in v1.0.
3. **Replay.** Every Notary Receipt **MUST** re-execute through the implementer's Lens against the original Bearing and produce the same Verdict (semantic equivalence at Tier-1; byte-equal canonicalization at Tier-2).
4. **Negative.** Malformed Bearings, expired signatures, unresolved issuers, and ambiguous rule conflicts **MUST** produce `lens:default_deny` Verdicts. PII smuggling attempts (e.g., injecting `email` at the top level of a Bearing) **MUST** be rejected.
5. **Privacy.** Receipt envelopes **MUST NOT** carry PII. Herald envelopes on the regulator surface **MUST** batch per §7.2. Custody deletion propagation **MUST** complete within the §8.2 window.

### §11.3 Self-attestation and the ledger

A conformance run produces a Notary-style signed manifest containing the implementer identifier, declared tier, runner version, fixture set hash, and per-case results. Manifests are submitted to a public append-only conformance ledger; the "PCSS Conformant" trademark badge is gated on a current ledger entry. Tier-2 manifests **MUST** be co-signed by an independent witness from the PCSS witness registry (regulators, accredited civil-society bodies, or foundation-approved auditors).

Manifests expire 365 days after `executed_at`; an expired badge is not a conformant badge.

## §12 References

- [RFC 2119: Key words for use in RFCs](https://www.rfc-editor.org/rfc/rfc2119)
- [RFC 7519: JSON Web Tokens](https://www.rfc-editor.org/rfc/rfc7519) (related, not used directly)
- [EIP-712: Typed structured data signing](https://eips.ethereum.org/EIPS/eip-712) (canonicalization model for Notary)
- [COPPA Updated Rule (16 CFR Part 312)](https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312)
- [KOSA (S.1409)](https://www.congress.gov/bill/118th-congress/senate-bill/1409)
- [California Age-Appropriate Design Code Act (CA-AADC)](https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB2273)
- [EU Digital Services Act (Reg 2022/2065)](https://eur-lex.europa.eu/eli/reg/2022/2065/oj)
- [UNCRC General Comment 25 (children's rights in the digital environment)](https://www.ohchr.org/en/documents/general-comments-and-recommendations/general-comment-no-25-2021-childrens-rights-relation)

## §13 Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0 (public review) | 2026-05-11 | Initial public-review publication. Drafted, ratified for public review, and published by Phosra Standards Body. |

---

*This is a public-review specification. It is not yet ratified by an independent standards body. See [GOVERNANCE.md](../GOVERNANCE.md) for the foundation transition plan.*
