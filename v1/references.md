# PCSS v1.0 References

This document is the full bibliography for PCSS v1.0. It extends `pcss-v1.0.md §12` and is the canonical location for normative citations, statutory references, and informative reading material. Statutes cited inline in the spec resolve here.

The bibliography is maintained on a **quarterly cadence** (March 1, June 1, September 1, December 1). Out-of-band updates are accepted for any statute change with an enforcement deadline within 90 days. Owner during the public-review period: Phosra Standards Body Legal Liaison, transitioning to the foundation per [`GOVERNANCE.md`](../GOVERNANCE.md).

## §0 How to read this document

This document does not introduce normative requirements beyond `pcss-v1.0.md`. Where a citation in the spec is informal (e.g., "COPPA §312.5"), this document provides: the legal short-form citation, the issuing authority, jurisdiction, enacted date, the canonical government-publisher URL, the PCSS capabilities affected, and any implementation deadlines.

Each section is sorted alphabetically by short name within its category. Status field values: `In force`, `In force (phased)`, `In force with partial injunction`, `Proposed`, `Repealed`, `Historical`.

## §1 Normative references

These are the documents PCSS implementations MUST conform to.

- **[RFC 2119](https://www.rfc-editor.org/rfc/rfc2119) + [RFC 8174](https://www.rfc-editor.org/rfc/rfc8174)** — Key words for use in RFCs to indicate requirement levels. MUST, MUST NOT, SHOULD, SHOULD NOT, MAY.
- **[RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)** — Ed25519 signature algorithm. The only signature suite PCSS v1.0 mandates.
- **[RFC 8785](https://www.rfc-editor.org/rfc/rfc8785)** — JSON Canonicalization Scheme (JCS). Used for envelope canonicalization prior to signing.
- **[RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)** — Date and time on the internet (ISO 8601 profile).
- **[RFC 3161](https://www.rfc-editor.org/rfc/rfc3161)** — Time-Stamp Protocol. Optional for Notary receipts on the regulator surface.
- **[JSON Schema 2020-12](https://json-schema.org/draft/2020-12)** — The wire-format validation grammar used in `v1/schema/`.
- **[OpenAPI 3.1](https://spec.openapis.org/oas/v3.1.0)** — The runtime API description format used in `v1/openapi.yaml`.
- **[EIP-712](https://eips.ethereum.org/EIPS/eip-712)** — Typed structured data signing. PCSS borrows the canonicalization model (not the Ethereum domain semantics) for Notary receipts.

## §2 Statutory references

PCSS is designed to satisfy the implementation requirements of these statutes. Citations in the spec resolve here.

### §2.1 United States — Federal

#### COPPA — Children's Online Privacy Protection Act

| Field | Value |
| --- | --- |
| Citation | 15 U.S.C. §§ 6501–6506; 16 CFR Part 312 |
| Authority | Federal Trade Commission (rulemaking & civil enforcement); State Attorneys General (concurrent enforcement under § 6504) |
| Jurisdiction | United States — Federal |
| Enacted | 1998-10-21 (Pub. L. 105-277, Div. C, Title XIII). Rule effective 2000-04-21. Amended 2013-07-01, 2025-04-22 (VPC modernization + biometric data inclusion). |
| Status | In force |
| Primary source | https://www.ecfr.gov/current/title-16/chapter-I/subchapter-C/part-312 |
| Statutory source | https://www.govinfo.gov/content/pkg/USCODE-2023-title15/html/USCODE-2023-title15-chap91.htm |
| Plain-language explainer (non-canonical) | https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions |
| PCSS touchpoints | Bearing §3.1 (`confidence: attested` requires VPC per §312.5); Threshold §5.2 (entire section keyed to COPPA VPC); Custody §8 (data minimization & deletion mirror §312.10) |
| Implementation deadlines | 2025 amendments: full compliance required by 2026-04-22 (one-year grace) |
| Short-form citation | "COPPA Rule, 16 CFR § 312.5" |

**Summary.** COPPA prohibits operators of websites and online services directed to children under 13, or with actual knowledge of collection from children under 13, from collecting personal information without verifiable parental consent. The FTC Rule (16 CFR Part 312) prescribes the operational details: notice, consent mechanisms, parental access rights, data minimization, and deletion.

**Why PCSS cites it.** COPPA is the load-bearing statute for the Threshold capability. PCSS's `vpc: true` flag in a Threshold envelope is defined as semantically equivalent to a § 312.5-compliant consent record. The 2025 amendments' biometric-data inclusion is why Bearing envelopes carry a `confidence` enum rather than a boolean.

#### KOSA — Kids Online Safety Act

| Field | Value |
| --- | --- |
| Citation | S. 1409, 118th Congress (2023); reintroduction expected 119th Congress (2025–2026) |
| Authority | Federal Trade Commission (primary); State Attorneys General (concurrent) |
| Jurisdiction | United States — Federal |
| Enacted | Passed Senate 2024-07-30 (91-3) as part of KOSPA package (S. 2073). Did not receive House floor vote in 118th Congress; expired 2025-01-03. Status as of 2026-05: awaiting reintroduction. |
| Status | Proposed (passed one chamber; expired) |
| Primary source | https://www.congress.gov/bill/118th-congress/senate-bill/1409 |
| Plain-language explainer (non-canonical) | https://www.commonsensemedia.org/kids-action/articles/kids-online-safety-act |
| PCSS touchpoints | Lens §4 (algorithmic recommendation opt-out); Aegis §6 (addictive design hard blocks for minors); Verdict §9 (annual independent audit requirement); Herald §7 (parental notification surfaces) |
| Implementation deadlines | Not yet in force. KOSA as drafted provides 18 months from enactment for covered platforms (50M+ MAU) and 24 months for smaller covered platforms |
| Short-form citation | "KOSA § 3(a)" (duty of care) |

**Summary.** Establishes a duty of care for "covered platforms" to prevent and mitigate enumerated harms to minors (mental health, bullying, exploitation, substance abuse promotion). Mandates the strictest privacy settings by default for minors, an opt-out from algorithmic recommendations, restrictions on addictive design features, and annual independent audits.

**Why PCSS cites it.** KOSA is the principal US federal driver for the Lens (tier gating) and Verdict (algorithmic audit) capabilities. PCSS's Verdict envelope schema is designed to be sufficient evidence for a KOSA § 6 independent audit; this is the alignment Adopters should rely on when scoping their audit engagement.

### §2.2 European Union

#### EU DSA — Digital Services Act

| Field | Value |
| --- | --- |
| Citation | Regulation (EU) 2022/2065 |
| Authority | European Commission (VLOPs / VLOSEs); EU Member-State Digital Services Coordinators (other platforms); European Board for Digital Services |
| Jurisdiction | European Union (extra-territorial: applies to services offered to EU recipients regardless of provider establishment) |
| Enacted | 2022-10-19 (signed); entered into force 2022-11-16. Applicable to VLOPs / VLOSEs 2023-08-25. Applicable to all platforms 2024-02-17 |
| Status | In force |
| Primary source | https://eur-lex.europa.eu/eli/reg/2022/2065/oj |
| Consolidated text | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:02022R2065-20221019 |
| Plain-language explainer (non-canonical) | https://digital-strategy.ec.europa.eu/en/policies/digital-services-act-package |
| PCSS touchpoints | Lens §4 (Art. 28 minor-protection by design); Aegis §6 (Art. 28(2) targeted-advertising ban for minors); Verdict §9 (Art. 34–35 systemic risk assessment & Art. 37 independent audit); Custody §8 (Art. 14 transparency & data-access rules) |
| Implementation deadlines | In force. Art. 28(2) and Art. 34/35 are continuing obligations; first VLOP audit cycle 2024–2025 |
| Short-form citation | "DSA Art. 28(2)" |

**Summary.** Horizontal regulation governing all online intermediaries operating in the EU, with graduated obligations for online platforms and stringent additional duties for Very Large Online Platforms (VLOPs, ≥ 45M EU MAU). For child safety: Art. 28 mandates a high level of privacy, safety, and security by design for minors, and prohibits profiling-based advertising to minors.

**Why PCSS cites it.** DSA Art. 28 is the EU's functional equivalent of KOSA's duty of care + COPPA's data restrictions, bundled. PCSS's Lens default-deny rule (§4.2) and Aegis targeted-ad-blocking category are scoped to satisfy Art. 28(2) without requiring Adopter-specific legal analysis per Member State.

### §2.3 United States — State

#### CA-AADC — California Age-Appropriate Design Code Act

| Field | Value |
| --- | --- |
| Citation | Cal. Civ. Code §§ 1798.99.28–1798.99.40 (added by AB 2273, 2021–2022 Reg. Sess.) |
| Authority | California Attorney General; California Privacy Protection Agency (concurrent) |
| Jurisdiction | California, United States (applies to businesses providing an online service likely to be accessed by California-resident children under 18) |
| Enacted | 2022-09-15 (signed); originally effective 2024-07-01. Enforcement paused by preliminary injunction in *NetChoice v. Bonta*, N.D. Cal., 2023-09-18; partially vacated and remanded by 9th Cir. 2024-08-16; status as of 2026-05: partial enforcement, DPIA requirement enjoined, default-privacy provisions enforceable |
| Status | In force with partial injunction |
| Primary source | https://leginfo.legislature.ca.gov/faces/billNavClient.xhtml?bill_id=202120220AB2273 |
| Codified text | https://leginfo.legislature.ca.gov/faces/codes_displayText.xhtml?division=3.&part=4.&lawCode=CIV&title=1.81.46 |
| Plain-language explainer (non-canonical) | https://5rightsfoundation.com/in-action/california-age-appropriate-design-code.html |
| PCSS touchpoints | Lens §4 (high privacy default for minors); Threshold §5 (granular scope grants align to § 1798.99.31(a)(7)); Verdict §9 (DPIA requirement — enjoined but spec retains capability); Custody §8 (data-minimization per § 1798.99.31(a)(8)) |
| Implementation deadlines | Default-privacy & data-minimization provisions enforceable; DPIA provisions enjoined pending appeal |
| Short-form citation | "CA-AADC, Cal. Civ. Code § 1798.99.31(a)" |

**Summary.** Modeled on the UK Age Appropriate Design Code, CA-AADC requires businesses providing online services likely to be accessed by children under 18 to configure default privacy settings to the highest level, conduct Data Protection Impact Assessments before launching new features, and avoid using children's data in ways that are materially detrimental to their well-being.

**Why PCSS cites it.** CA-AADC is the state-level template that drove the entire US AADC wave (MD, VT, CT). PCSS's `granted_scope` field design in Threshold envelopes (§5.1) was specifically built to enumerate the categories CA-AADC § 1798.99.31(a)(7) requires to be off-by-default.

### §2.4 United Kingdom

#### UK OSA — Online Safety Act 2023

| Field | Value |
| --- | --- |
| Citation | Online Safety Act 2023, c. 50 |
| Authority | Ofcom (the UK communications regulator) — sole enforcement |
| Jurisdiction | United Kingdom (extra-territorial: applies to user-to-user and search services with significant UK user links) |
| Enacted | 2023-10-26 (Royal Assent). Phased commencement: illegal-content duties Q1 2025; child-safety duties (Part 3, Chapter 2 § 11–§ 12) effective 2025-07-25 with codes of practice in force; categorized service duties Q4 2025–Q2 2026 |
| Status | In force (phased) |
| Primary source | https://www.legislation.gov.uk/ukpga/2023/50/contents |
| Ofcom guidance | https://www.ofcom.org.uk/online-safety |
| Plain-language explainer (non-canonical) | https://www.gov.uk/government/publications/online-safety-bill-supporting-documents |
| PCSS touchpoints | Bearing §3 (s. 12 "highly effective age assurance"); Lens §4 (s. 11 children's risk assessments → safety duties); Aegis §6 (Schedule 6 priority illegal content & primary priority content harmful to children); Herald §7 (s. 21 transparency reporting); Verdict §9 (s. 14 children's access assessments & s. 21 transparency reports) |
| Implementation deadlines | Highly effective age assurance for porn services: 2025-07-25. Child-safety duties for user-to-user services: rolling per Ofcom codes, full compliance 2025-Q4 |
| Short-form citation | "OSA s. 11" (safety duties protecting children) |

**Summary.** Comprehensive UK regime imposing safety duties on user-to-user services, search services, and providers of pornographic content. For children: § 11 requires risk assessment and proportionate measures to prevent encounter of content harmful to children; § 12 mandates highly effective age assurance where the service is likely to be accessed by children or where it publishes pornographic content. Enforced by Ofcom with fines up to 10% of qualifying global revenue or £18M (whichever higher).

**Why PCSS cites it.** OSA § 12's "highly effective age assurance" standard is the canonical regulatory test for what Bearing § 3.1 means when it claims `confidence: attested`. The PCSS conformance test plan (§11) includes a specific test case that an Adopter's Bearing implementation can produce evidence sufficient for Ofcom's expected audit posture under the § 12 code of practice.

### §2.5 Additional statutes (summary table)

The following statutes are cited by rules in [`v1/rules/`](rules/) but not yet fully expanded in this document. Full entries land per the quarterly cadence above.

| Short name | Jurisdiction | Status | PCSS touchpoints |
| --- | --- | --- | --- |
| COPPA 2.0 | US Federal | Proposed | Lens §4 (Art. behavioral ad ban under 17) |
| NY S9051 | US-NY | Proposed | Aegis §6 (AI companionship block) |
| CA AB 1043 | US-CA | Enacted, effective 2027-01-01 | Bearing §3 (OS age signal consumption) |
| GDPR Art. 8 | EU | In force | Threshold §5 (parental consent under 16) |
| UK AADC | UK | In force | Threshold §5 (high privacy defaults) |
| AU Online Safety Act 2021 + 2024 amendments | AU | In force (phased) | Bearing §3 (social media age verification under 16) |
| TX SCOPE Act | US-TX | In force with partial injunction | Threshold §5 |
| VA SB 854 | US-VA | In force | Lens §4 (notification curfews) |
| FL HB 3 | US-FL | Enjoined | Bearing §3 |
| LGPD-K (Brazil) | BR | Proposed | Threshold §5 |
| DPDP (India) | IN | Phased commencement 2026 | Threshold §5, Custody §8 |

## §3 Informative references

PCSS does not require conformance with the following but cites them as background.

- **[UN Convention on the Rights of the Child General Comment 25 (2021)](https://www.ohchr.org/en/documents/general-comments-and-recommendations/general-comment-no-25-2021-childrens-rights-relation)** — The moral and human-rights frame underlying PCSS. Cited in `pcss-v1.0.md §2 Premise`.
- **[OECD Recommendation on Children in the Digital Environment (2021)](https://legalinstruments.oecd.org/en/instruments/OECD-LEGAL-0389)** — Soft-law multilateral framework.
- **[IEEE 2089-2021](https://standards.ieee.org/ieee/2089/7633/)** — Standard for Age-Appropriate Digital Services Framework. Process standard, not wire-protocol — referenced for product-design alignment.
- **ISO/IEC 27566 (in draft)** — Age assurance ISO project. Worth tracking; not yet citable.
- **[NIST AI Risk Management Framework 1.0](https://www.nist.gov/itl/ai-risk-management-framework)** — Background for the Verdict/audit capability.
- **[5Rights Foundation Children's Code Design Guidance](https://5rightsfoundation.com/)** — Design-pattern references.
- **[FOSI Good Digital Parenting](https://www.fosi.org/good-digital-parenting)** — Civil-society design patterns.
- **[Common Sense Media Privacy Program criteria](https://www.commonsensemedia.org/privacy-program)** — Civil-society rating taxonomy referenced by `csm_nfk_hard_block` and `csm_ai_chatbot_tier_gate`.

## §4 Currency and maintenance

- **Owner during public review.** Phosra Standards Body Legal Liaison.
- **Owner after foundation transition.** Reference Maintenance Working Group (to be seated per [`ROADMAP.md`](../ROADMAP.md) H3).
- **Cadence.** Quarterly, with out-of-band updates for enforcement deadlines.
- **Source of truth for change detection.** The Phosra-operated `scripts/legislation-scanner.mjs` is reused as the upstream change detector during public review; a quarterly diff against this document opens a `references-update` issue.
- **Versioning.** This document carries its own minor version. Spec major versions pin the bibliography minor they were authored against.
- **Deprecation.** Statutes that are repealed or permanently enjoined move to a future `§2.x Historical` subsection rather than being deleted; long-lived signed receipts may still reference them.

## §5 Changelog

| Version | Date | Change |
| --- | --- | --- |
| 1.0.0 | 2026-05-11 | Initial public-review publication. Five fully-cited statutes (COPPA, KOSA, EU DSA, CA-AADC, UK OSA) plus eleven additional statutes referenced in the summary table for completion in subsequent quarterly updates. |
