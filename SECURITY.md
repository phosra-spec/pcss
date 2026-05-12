# Security policy

> **Status:** Interim. The PCSS Standards Body operates under [GOVERNANCE.md](GOVERNANCE.md) until the foundation transition (target H3 2027 per [ROADMAP.md](ROADMAP.md)). Reports during the interim are received by Phosra Inc. as steward.

## Scope

This policy covers:

- The PCSS specification (`v1/pcss-v1.0.md`, capability docs, schemas, OpenAPI surface)
- The reference TypeScript server (`reference/server/`)
- The published SDK packages (`@phosra/types`, `@phosra/sdk`, `@phosra/conformance`, `@phosra/cli`)
- The conformance test fixtures (`v1/conformance/`)

Out of scope (report to the relevant vendor):

- Phosra Inc.'s production backend (report at `security@phosra.com`)
- Third-party adopter implementations (report to the adopter)

## Reporting a vulnerability

Email **security@phosra-spec.org** with a clear description of the issue. We will acknowledge within 72 hours.

Reports SHOULD include:

- The affected file(s) and version(s)
- A minimal reproducible example or attack scenario
- The threat-model actor whose capability you are demonstrating (see [`v1/security.md` §1](v1/security.md))
- Whether you intend to publish under a coordinated disclosure window

If you cannot use email, open a private security advisory via GitHub's "Security" tab on this repository. **Do not file a public issue.**

## Coordinated disclosure window

We work on a **90-day coordinated disclosure window** by default. Reporters who need a longer or shorter window for a specific reason may negotiate at acknowledgement time. Phosra commits to the following timeline for the interim:

- **Day 0** — Acknowledge receipt within 72 hours
- **Day 14** — Severity classification + initial mitigation plan shared with reporter
- **Day 30** — Draft fix in private branch + draft advisory
- **Day 60** — Adopter notification (Charter cohort + ledger-listed implementers)
- **Day 90** — Public advisory + patch release

Issues that affect signing key compromise, cross-implementer signature forgery, or PII leakage in the wire format are treated as **CRITICAL** and may use a shorter window with reporter consent.

## What counts as a vulnerability

- Cryptographic flaws: signature forgery, replay weakness, canonicalization divergence between implementations
- PII leakage: any spec/schema/SDK path that allows identifying data (email, name, phone, device ID, precise geolocation, exact DOB) to traverse the wire
- Authentication bypass: forged Bearings, unauthorized Threshold issuance, registry-key spoofing
- Supply-chain: compromised SDK or conformance-runner builds
- Conformance bypass: ways to pass the conformance suite while violating normative spec requirements

What does **not** count as a security vulnerability under this policy:

- Disagreements about what the spec *should* mandate (these are RFC matters — see [rfcs/](rfcs/))
- Performance / DoS issues that don't break authentication or privacy
- Issues in third-party adopter implementations
- Statute-tracking errors (file a `statute-update` issue)

## Public ledger of advisories

Resolved advisories are published at `security/advisories/` in this repo (forthcoming as advisories land). The interim Phosra-Inc.-stewarded process will hand off to the foundation's CVE-assignment authority post-transition.

## GPG / signing

A PGP key for `security@phosra-spec.org` will be published at this section once the address is operational; for now use plaintext email or a GitHub private advisory.

## Bug bounty

There is no bounty program during the public-review period. The Charter Adopter cohort and the foundation transition will revisit this once a stable cohort exists.
