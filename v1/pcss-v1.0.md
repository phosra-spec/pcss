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

When Lens cannot resolve a verdict (missing bearing, unknown surface, network error), the implementation **MUST** return `allow: false` with `reason: "lens_default_deny"` and cite the applicable jurisdictional default.

### §4.3 Conflict resolution

When two jurisdictional rule sets apply (e.g., a request from California with a bearing issued in EU), Lens **MUST** apply the stricter rule. The Verdict envelope **MUST** include both jurisdictions in its `cited` array.

## §5 Threshold — parental consent

Threshold specifies the wire format for parental consent and access boundaries. This is the capability through which a parent's choice enters the network.

### §5.1 Wire format

A Threshold envelope is documented in [`v1/schema/threshold.json`](schema/threshold.json). It includes:

- `consent_id`: stable opaque identifier.
- `granted_scope`: a list of scopes the parent has authorized (e.g., `dm:friends-only`, `purchases:requires-approval`, `feed:no-recommender`).
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

Herald specifies the wire format for parent and regulator notifications.

### §7.1 Surfaces

Herald notifications target three surfaces:

- **Parent surface** — typically a parental-control app or OS notification.
- **Regulator surface** — a signed receipt stream subscribed by a regulator.
- **Civil-society surface** — a signed receipt stream subscribed by an accredited civil-society body.

### §7.2 Cadence

Herald **SHOULD** batch notifications to avoid alert fatigue. The recommended cadence is:

- Hard blocks (§6): immediate.
- Privacy-relevant events (data access, profile change): daily summary.
- Aggregated usage patterns: weekly summary.

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
- `signature`: ed25519 signature using EIP-712-style typed-data canonicalization.
- `signer`: the Notary's registered key identifier.

### §10.2 Replay and verification

A regulator or civil-society body **MUST** be able to:

1. Request a receipt by `receipt_id`.
2. Verify the signature against the Notary's registered public key.
3. Re-execute the underlying Lens evaluation against the original Bearing envelope and confirm that the same Verdict is produced.

### §10.3 Key management

Notary signers **MUST** rotate keys at least annually. Rotation events **MUST** be published to the PCSS registry with the new public key and the rotation timestamp. Receipts signed with rotated keys remain valid; the registry must retain rotated public keys for the receipt's `expires_at` window.

### §10.4 Privacy

Receipts **MUST NOT** carry PII. Receipts carry `bearing_id` (opaque) and `verdict_id` (opaque) only. The underlying Bearing envelope contains only the `age_band` and `jurisdiction`; no birth date, no real name, no device identifier.

## §11 Conformance test plan

See [`v1/conformance/`](conformance/). The conformance test plan defines:

- Schema validation cases (every wire envelope MUST validate against its JSON Schema).
- Signature verification cases.
- Cross-jurisdictional resolution cases.
- Replay verification cases.

The conformance suite is `make conformance` runnable; results are published in `conformance-reports/` per adopter implementation.

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
