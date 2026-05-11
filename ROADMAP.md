# PCSS Roadmap

**Status: 2026-05-11 · v1.0 public review**

This roadmap synthesizes commitments made in the v1.0 public-review launch ([blog post](https://www.phosra.com/blog/pcss-v1-public-review)) and the foundation-transition path in [GOVERNANCE.md](GOVERNANCE.md) into a single timeline. It is the contract the Phosra Standards Body offers prospective Charter Adopters: here is what we will ship, by when, and who owns it.

Dates are targets, not guarantees. Slippage will be reported in `council-minutes/` once the Adopter Council is seated. Until then, slippage is reported as a `roadmap-update` issue on this repository.

Three horizons:

- **Horizon 1 — Public review** (2026-05-11 → 2026-08-11): everything that must exist before a serious adopter can sign.
- **Horizon 2 — v1.1 clarification release** (Q3 2026 → Q4 2026): feedback baked in, no breaking changes, first Charter Adopter live.
- **Horizon 3 — v2.0 foundation transition** (Q4 2026 → Q2 2027): independent stewardship, breaking changes, steady-state Council.

---

## Horizon 1 — Public review (May 11 → August 11, 2026)

These are the eight gates that close the credibility gap between "Phosra published a spec" and "PCSS is a multi-vendor standard." All eight ship in 90 days.

| # | Milestone | Target | Owner |
| --- | --- | --- | --- |
| H1.1 | **Conformance test runner (Tier-0)** — `make conformance` executable, self-attestation flow, public results template under `conformance-reports/` | 2026-06-15 | Conformance WG (Phosra Inc. interim chair) |
| H1.2 | **Six WG chairs published** — Age Signals, Algorithmic Transparency, Hard Blocks, Parental Consent, Regulatory Mapping, Conformance; chairs include at least three non-Phosra individuals | 2026-07-01 | Phosra Inc. (recruiting); ratified at first Council meeting |
| H1.3 | **Adopter Council seats opened** — application form live at phosra.com/registry, civil-society and academic seats prioritized, youth-rep search begins | 2026-07-15 | Phosra Inc. governance lead |
| H1.4 | **Reference TypeScript SDK published** — `@phosra/sdk` on npm at a `0.x` version tracking v1.0 public review; repo at `phosra-spec/sdk-typescript` | 2026-07-20 | Phosra Inc. SDK team |
| H1.5 | **RFC process operational** — `rfcs/` directory created, `0000-template.md` merged, first RFC accepted end-to-end (target: a clarifying RFC raised by an external reviewer) | 2026-07-25 | Phosra Inc. + RFC author (external) |
| H1.6 | **Bibliography and security model docs in repo** — `references.md` extending §12, `security-model.md` covering threat model, signing-key rotation, replay defense | 2026-08-01 | Phosra Inc. (bibliography); Notary capability owner (security model) |
| H1.7 | **First external implementation landed** — a non-Phosra implementer publishes a self-attested Tier-0 conformance report against the public spec | 2026-08-08 | External party (target: one Charter Adopter candidate) |
| H1.8 | **Foundation transition candidates evaluated** — written shortlist memo published comparing Linux Foundation, OASIS Open, OpenJS Foundation, and a dedicated 501(c)(6); preferred host named with rationale | 2026-08-11 | Phosra Inc. governance lead + outside counsel |

The gate for declaring Horizon 1 complete is H1.7 — an external implementer self-attesting at Tier-0. Until that gate clears, PCSS is a single-vendor wire format with aspirational governance. After it clears, PCSS is a multi-vendor standard with a credible governance plan.

---

## Horizon 2 — v1.1 clarification release (Q3 2026 → Q4 2026)

v1.1 is a clarification release. It bakes in 90 days of public-review feedback. No breaking changes — every implementation that conforms to v1.0 conforms to v1.1.

| Milestone | Target | Notes |
| --- | --- | --- |
| **v1.0 ratification at first Adopter Council meeting** | Q3 2026 (Sept) | First seated Council; quorum required per GOVERNANCE.md vote thresholds |
| **Conformance Tier-1 test suite** | Q3 2026 (Sept) | Tier-1 adds signature verification + cross-jurisdictional resolution beyond Tier-0 schema validation |
| **v1.1 spec text published** | Q4 2026 (Oct) | Clarifying edits only; deprecation flags for anything targeted at v2.0; preserves all v1.0 schemas and capability names |
| **Three external implementations live** | Q4 2026 (Nov) | Three non-Phosra Tier-0 or Tier-1 attested implementations on the public registry |
| **First Charter Adopter in production** | Q4 2026 (Nov) | Production traffic, not pilot; signed receipts visible in the Notary stream |
| **CSM integration shipped** (conditional) | Q4 2026 (Dec) | Contingent on design-partner deal closing; if so, CSM age ratings + Privacy Program tiers become canonical inputs to the Lens capability |
| **Pre-foundation transition prep** | Q4 2026 (Dec) | Copyright assignment paperwork drafted; trademark assignment drafted; IPR / antitrust policies of preferred host reviewed |

Owners during Horizon 2 shift from "Phosra Inc." to the seated working groups and the Adopter Council. Phosra retains editorial responsibility for the spec text until copyright assigns at v2.0.

---

## Horizon 3 — v2.0 foundation transition (Q4 2026 → Q2 2027)

v2.0 is the breaking-change release and the governance handoff. After v2.0, PCSS is no longer a Phosra-stewarded specification; it is foundation-stewarded with Phosra holding one of nine Council seats.

| Milestone | Target | Notes |
| --- | --- | --- |
| **Foundation handover complete** | Q1 2027 | Linux Foundation / OASIS / OpenJS / dedicated 501(c)(6) host depending on Horizon 1 shortlist outcome; copyright + trademark assigned; RAND-RF IPR policy adopted |
| **Conformance Tier-2 test suite** | Q1 2027 | Adds replay verification, signing-key rotation tests, multi-jurisdiction conflict resolution; required for Charter Adopter renewal |
| **v2.0 spec text published** | Q2 2027 | Breaking changes permitted: deprecations from v1.0 retired, capability surface refined based on 12 months of production feedback |
| **10+ external implementations on the public registry** | Q2 2027 | Mix of platforms, OS/device makers, and parental-control products; no single vendor accounts for more than 30% of attested receipts |
| **Adopter Council steady-state** | Q2 2027 | All nine seats filled including youth-rep; 2-year staggered terms operating; minutes published monthly |
| **Internationalization** | Q2 2027 | Authoritative spec text remains English; translations published in at least Spanish, French, German, and Japanese; non-English RFC comments accepted with translator support |
| **Post-quantum signature consideration** | Q2 2027 | RFC drafted (not necessarily accepted) on adding a PQ-safe signature suite to Notary alongside ed25519; decision deferred to Council |

The signal that Horizon 3 has succeeded is not "v2.0 shipped." It is "Phosra Inc. could disappear tomorrow and PCSS would continue." The roadmap is finished when that statement is true.

---

## Risk register

Five risks could derail this roadmap and we name them explicitly so adopters can price them in. **(1) No Charter Adopters sign** — the most likely failure mode; if the cohort does not close by Q3 2026, v1.0 ratification slips and the foundation transition loses its political mandate, mitigated by H1.7's requirement of an external implementation independent of cohort signature. **(2) Conformance suite slips** — Tier-0 by 2026-06-15 is aggressive; if it slips past August, prospective adopters have nothing concrete to validate against and the public-review period extends, mitigated by scoping Tier-0 to schema validation only. **(3) Foundation rejects the application** — Linux Foundation, OASIS, and OpenJS all have selective intake; rejection forces the 501(c)(6) fallback which adds 6+ months and legal cost, mitigated by parallel applications and a named fallback host. **(4) CSM design-partner deal collapses** — Lens capability's age-rating inputs lose their canonical source; mitigated because CSM is one input among several (Bearing accepts any signed age signal) and the spec does not name CSM normatively. **(5) Regulatory pivot from US to EU** — if KOSA stalls and EU DSA enforcement accelerates, the spec's center of gravity shifts and US-focused Charter Adopters may deprioritize; mitigated by Regulatory Mapping WG's cross-jurisdictional design and by recruiting an EU DSA liaison to the regulator-observer seat early in Horizon 1.

---

*The standard does not wink.*
