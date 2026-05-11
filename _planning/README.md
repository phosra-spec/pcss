# PCSS Planning

> **Status: 2026-05-11.** This directory captures the in-flight planning for fleshing out PCSS v1.0 from "table of contents" to "implementable specification." It is intentionally public — public-review means the gaps are public too.

The v1.0 public-review release ([`pcss-v1.0.md`](../v1/pcss-v1.0.md), [`ROADMAP.md`](../ROADMAP.md)) is honest about what is unfinished. This directory enumerates **what is unfinished**, **what good looks like**, and **who owns it**. Where a track has an active RFC, a draft document, or an open issue, this README links to it.

The planning is organized into 12 tracks. Each track maps to a Horizon-1 milestone in [`ROADMAP.md`](../ROADMAP.md) and has an identified owner.

## The 12 tracks

| # | Track | What it produces | Status |
| - | --- | --- | --- |
| 1 | **Spec text gaps** | Rewrites of §4.3 (conflict resolution), §7 (Herald), §8 (Custody), §10.2 (replay), §11 (conformance). Reconciliation of OpenAPI and prose. | Partial — §4 expanded 2026-05-11; §7/§8/§11 still stubs |
| 2 | **Capability docs** | Eight deep-dive companion docs at `v1/capabilities/{bearing,lens,threshold,aegis,herald,custody,verdict,notary}.md`. Each ~1500 words with state diagrams, statute mappings, and "common mistakes." | All stubs |
| 3 | **Conformance suite** | Executable Tier-0/1/2 test runner at `v1/conformance/` plus fixtures, expected outputs, and a public conformance ledger. | Stub README only |
| 4 | **Reference TypeScript SDK** | Four npm packages: `@phosra/types`, `@phosra/sdk`, `@phosra/conformance`, `@phosra/cli`. Generated from JSON Schemas with hand-written ergonomic overlay. | Not started; design complete |
| 5 | **Rule registry** | `v1/rules/*.json` (one rule per file) + `v1/statutes/*.json` (deduped statute references). First batch of 15 priority rules: KOSA recommender-off, COPPA VPC, NY S9051 chatbot, CA AB 1043 OS signal, EU DSA Art. 28, UK OSA s. 12, CA-AADC, GDPR Art. 8, and others. | Schema exists; no rule content |
| 6 | **Governance process docs** | RFC template, six WG charters, Adopter Council formation, IPR/patent policy, trademark policy, antitrust policy, civil-society participation, foundation transition, meeting cadence, 90-day tracker. | GOVERNANCE.md + CONTRIBUTING.md only |
| 7 | **Reference implementation** | Public TypeScript server at `reference/server/`, hosted at `reference.pcss.dev`, MIT-licensed. ~80% lifted from existing `examples/typescript/implementer.ts`. | Not started; design complete |
| 8 | **Codebase harvest** | Lift signing utilities (Apache-2.0), the 9-capability taxonomy (CC BY 4.0), the glossary, and the rule-category enum from Phosra's main codebase. Mirror the legislation registry. | Not started; inventory complete |
| 9 | **CSM / rating-body integration** | New `rating-bearing.json` schema (Rating Bearing as sibling envelope), Rater Registry, `aegis:nfk` category in v1.x. Keeps spec vendor-neutral while accommodating CSM, ESRB, PEGI, BBFC, IARC. | Not started; design complete |
| 10 | **Bibliography** | `v1/references.md` extending §12 into a full normative + statutory + informative reference. 15 priority statutes fully cited with primary-source URLs and PCSS touchpoints. | Not started; structure complete |
| 11 | **Security model** | `v1/security.md` — threat model, 11 named open issues (OI-1 through OI-11) with target versions for revocation, pairwise pseudonyms, PQ migration, conformance-runner key handling, OS Bearing Producer requirements. | Not started; outline complete |
| 12 | **Roadmap** | [`ROADMAP.md`](../ROADMAP.md) — three horizons through v2.0 foundation transition. Eight Horizon-1 gates with dates and owners. Five-risk register. | **Shipped 2026-05-11** |

In addition, **six audience-targeted implementer guides** at `v1/guides/` are planned for `parental-control-apps`, `platforms`, `os-makers`, `civil-society`, `regulators`, and `developers`.

## Already landed (commits since launch)

- `e85e927` — [`ROADMAP.md`](../ROADMAP.md): three-horizon timeline, 8 H1 gates, risk register.
- (this commit) — Three missing JSON Schemas: `threshold.json`, `herald.json`, `custody.json`. Spec §4 contradiction (`lens_default_deny` reason code, OpenAPI 422 vs. prose) reconciled. §4.3 conflict resolution expanded from one paragraph to seven subsections with worked example. §4.4 canonical surface registry added.

## Highest-priority open work (P0)

The Horizon-1 gates depend on these closing:

1. **Conformance test runner skeleton** (H1.1, target 2026-06-15). The schemas now exist for every capability that has a wire envelope, so the runner can begin against real fixtures.
2. **15 priority rules in `v1/rules/`** (Track 5). Lens evaluations have no real rules to evaluate against today. Without rules, conformance is schema validation only.
3. **`§7 Herald` and `§8 Custody` prose expansion** (Track 1). Both sections have a schema now but the prose is ~150 words each.
4. **RFC template + first RFC** (Track 6, H1.5). Cannot operate the governance process described in `GOVERNANCE.md` without it.

## How to participate

This is a public-review spec. The fastest way to influence v1.0 ratification is to:

1. **File an issue** against any open track. Comment volume is the strongest signal we have for what's important to adopters.
2. **Open a PR** against a stub. The eight capability docs at `v1/capabilities/*` are the lowest-friction places to contribute — pick the one closest to your area of expertise.
3. **Draft an RFC** once the template lands (target 2026-07-25). RFCs influence v1.1 and v2.0 substantively.
4. **Apply to the Charter Adopter cohort** at [phosra.com/partners/charter](https://www.phosra.com/partners/charter) for the closest possible voice in shaping the protocol.

Civil-society organizations and academic researchers are exempt from the Tier-2 sponsorship requirement that otherwise applies at the `final-call` stage. See [GOVERNANCE.md](../GOVERNANCE.md) for the rationale.

---

*This planning surface is not the spec. It is what is missing from the spec. The spec is in [`v1/`](../v1/). If something here contradicts the spec, the spec wins; please file an issue.*
