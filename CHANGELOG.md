# Changelog

All notable changes to PCSS land here in [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. The spec's own `§13 Changelog` in [`v1/pcss-v1.0.md`](v1/pcss-v1.0.md) is a high-level pointer to entries here.

## [Unreleased]

### Added
- `enforcement_status` enum on every rule in `v1/rules/` (`in_force` / `in_force_phased` / `in_force_partial_injunction` / `proposed` / `enjoined` / `superseded` / `repealed`).
- `advisory` boolean on rules. CI rejects `proposed` rules without `advisory: true`.
- `applicable_from` / `applicable_until` / `superseded_by` fields on `schema/rule.json`.
- Reserved top-level v1.1 fields in schemas: `verdict.nonce`, `verdict.registry_version`, `receipt.prev_receipt_hash`, `bearing.device_attestation`, `bearing.pairwise_for`.
- `signature.alternate_signatures` array + `signature.extensions` object on every signed envelope (Bearing, Threshold, Herald, Custody, Receipt) for hybrid post-quantum migration.
- `.github/` substrate: workflow `validate.yml`, 5 issue templates, PR template, CODEOWNERS.
- `SECURITY.md` with 90-day coordinated disclosure policy.

### Changed
- **Canonicalization is now RFC 8785 JCS + PCSS domain prefix.** Spec §10.2.1, `capabilities/notary.md`, and `@phosra/sdk/server canonicalize.ts` all match. Test vectors forthcoming. Signing input is `b"\x00PCSS-v1.0\x00"  ||  JCS(envelope_without_signature)`; ed25519 hashes internally — no separate SHA-256 pass.
- `signature.alg` is now a pattern, not a single-value enum. v1.0 implementations sign `ed25519`; v1.1 adds hybrid suites.
- `signature.value` regex tightened to `^[A-Za-z0-9_-]{86}$` (exactly 86 base64url chars = 64 ed25519 bytes).
- Extension blocks across every envelope are now locked: `propertyNames` enforces vendor-prefix grammar; a 22-key PII blocklist (`email`, `phone`, `name`, `device_id`, `imei`, `idfa`, `gaid`, `mac_address`, `ssn`, `dob`/`birth*`, `lat`/`lon`/`precise_geo`, `ip`/`ip_address`) forbids those keys regardless of vendor prefix.
- CA-AADC citations rewritten from `§22675` (bill section) to `§1798.99.31` (codified Cal. Civ. Code) throughout spec, capability docs, and rule registry.
- `capabilities/custody.md`: EU DSA Art. 14 → Art. 24(5) for the transparency-database SoR reference (Art. 14 is T&Cs).
- `capabilities/aegis.md`: CSAM EU citation corrected from EU DSA Art. 28 to Directive 2011/93/EU + proposed CSAR.

## [1.0.0-public-review] — 2026-05-11

### Added
- Initial public review of PCSS v1.0.
- `README.md`, `GOVERNANCE.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `ROADMAP.md`, `LICENSE` (CC BY 4.0).
- Canonical spec `v1/pcss-v1.0.md` with 13 sections (Charter, Premise, Bearing, Lens, Threshold, Aegis, Herald, Custody, Verdict, Notary, Conformance, References, Changelog).
- 7 JSON Schemas: `bearing`, `verdict`, `receipt`, `threshold`, `herald`, `custody`, `rule`.
- OpenAPI 3.1 surface (`v1/openapi.yaml`).
- 9 capability docs (Charter detailed; 8 deep docs landed 2026-05-11/12).
- 15 priority rules in `v1/rules/` covering KOSA, COPPA, COPPA 2.0, CA-AADC, CA AB 1043, NY S9051, EU DSA, EU GDPR, UK OSA, UK AADC, AU OSA, CSM NFK + AI tiers.
- Bibliography (`v1/references.md`) with 5 fully-cited statutes.
- Security model (`v1/security.md`) with 11 open issues targeted at v1.1.
- Conformance suite scaffold: 7 Bearing fixtures, 8 request fixtures, 8 expected Verdicts, 5 test categories described.
- RFC process: `rfcs/0000-template.md` + `rfcs/README.md`.
- `@phosra/sdk` workspace at `sdk-typescript/` with four packages (`@phosra/types`, `@phosra/sdk`, `@phosra/conformance`, `@phosra/cli`).
- Reference TypeScript server at `reference/server/` implementing the OpenAPI surface.

[Unreleased]: https://github.com/phosra-spec/pcss/compare/v1.0.0-public-review...HEAD
[1.0.0-public-review]: https://github.com/phosra-spec/pcss/releases/tag/v1.0.0-public-review
