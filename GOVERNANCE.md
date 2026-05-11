# PCSS Governance

**Status: 2026-05 · v1.0 public review**

PCSS is currently stewarded by the [Phosra Standards Body](https://www.phosra.com), with a documented transition path to independent foundation governance.

This document describes the present state honestly: PCSS v1.0 was drafted, ratified for public review, and is being maintained by Phosra Inc. until a Foundation transition completes. Adopters relying on PCSS should read this in full before signing.

## Present-day stewardship (v1.0 public review)

PCSS v1.0 is published by **Phosra Inc.** ("Phosra"), a Delaware corporation. Phosra:

- Authored the canonical specification (`v1/pcss-v1.0.md`)
- Operates the rule registry mirrored at [phosra.com/registry](https://www.phosra.com/registry)
- Maintains this repository and accepts pull requests under the [RFC process](CONTRIBUTING.md)
- Operates the reference implementation at [@phosra/sdk](https://github.com/phosra-spec/sdk-typescript) (forthcoming)

**Conflict-of-interest disclosure.** Phosra operates a commercial service (parental-controls enforcement, signed receipt notarization) that implements PCSS. Phosra is not the only implementer permitted, and the spec is licensed CC BY 4.0 specifically so alternative implementations can ship without Phosra's permission. Phosra contributors to the spec disclose their commercial interest when filing or reviewing RFCs.

## Adopter Council (forming)

At v2.0 ratification — target Q4 2026 after the Charter Adopter cohort closes — stewardship transitions to an Adopter Council with nine seats:

- 3 implementer seats (parental-control products, platforms, OS/device makers)
- 2 regulator-observer seats (non-voting; current candidates include FTC liaison + EU DSA equivalent)
- 1 civil-society seat (child-rights stakeholder — see Civil Society section below)
- 1 academic seat (children's online safety research)
- 1 Phosra seat (founding-steward continuity)
- 1 youth-representative seat (under-25 advisor)

All Council seats are 2-year terms; staggered so half the seats turn over each year. Council meetings are public; minutes are published in `council-minutes/`.

**Vote thresholds.**
- Editorial / clarifying changes: simple majority of seated members
- New capability or rule category: 2/3 majority
- Breaking change to existing capability: 2/3 majority + 30-day public comment + a one-version deprecation period
- License change or governance amendment: unanimous Council + sign-off from each Charter Adopter

## Working groups

Six working groups own specific sections of the spec:

| WG | Owns | Chair |
| --- | --- | --- |
| Age Signals | Bearing (§3) — sourcing, propagation, jurisdictional handling | TBA |
| Algorithmic Transparency | Verdict (§9) — audit trail, explainability | TBA |
| Hard Blocks | Aegis (§6) — CSAM, gambling, dark patterns | TBA |
| Parental Consent | Threshold (§5) — VPC, revocation, granular permission | TBA |
| Regulatory Mapping | Cross-jurisdictional rule alignment, registry | TBA |
| Conformance | Test plan, certification, signing | TBA |

WG chairs will be named within 90 days of v1.0 public-review publication. Each WG meets monthly; meetings are open to all Charter Adopters and partner-tier members.

## Independent foundation transition

The current intent is for PCSS to transition to an independent foundation no later than v2.0. Candidate hosts under evaluation:

- The Linux Foundation (Children's Safety project, if accepted)
- OASIS Open
- OpenJS Foundation (if joint with a JavaScript SDK project)
- A new 501(c)(6) standards body dedicated to PCSS

The transition includes:
- Spec copyright assignment from Phosra to the foundation
- Trademark assignment ("PCSS," "Phosra Conformant" badge) to the foundation
- IPR policy adoption (RAND/RF patent non-assertion)
- Antitrust policy adoption (W3C-style)
- Charter and bylaws ratified by the foundation host

Until that transition completes, Phosra holds spec copyright in trust for the eventual foundation. Phosra commits in writing that no PCSS section will be re-licensed away from CC BY 4.0.

## IPR policy (interim, until foundation transition)

- All contributions to this repository are licensed CC BY 4.0 to all subsequent users.
- Contributors grant a perpetual, royalty-free, irrevocable patent license to any patent claims essential to implementing the contributed text. This is the same provision used by W3C Community Group RFCs.
- Phosra will not assert patents against PCSS implementations.
- If a contributor cannot grant such a license (e.g., due to employer constraints), they must disclose it before the RFC is accepted.

A formal RAND-RF policy will be adopted on foundation transition.

## RFC process

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full RFC workflow.

## Antitrust

Until the foundation transition, contributors must not:

- Discuss specific commercial pricing, market allocation, customer assignments, or boycotts on Council calls, working-group calls, or in PCSS issues/PRs.
- Use PCSS participation to coordinate market behavior in ways that would violate Sherman, Clayton, or equivalent foreign antitrust laws.
- Disadvantage competing implementations via spec text (e.g., baking single-vendor authentication into a "neutral" wire format).

If any participant believes they have witnessed conduct in violation of this policy, contact `governance@phosra.com` or open a confidential issue with the maintainers.

## Civil society participation

Phosra commits that the Adopter Council civil-society seat will be filled by an organization with a demonstrated child-rights mandate (e.g., Family Online Safety Institute, ESRB, Common Sense Media, the Center for Humane Technology, or a UNCRC-affiliated body). Civil-society participation is not gated by the Tier-2 sponsorship requirement that gates implementer RFC sponsorship.

A formal Child Rights Impact Assessment — mapped to UNCRC General Comment 25 — will accompany v2.0.

## Changelog

| Date | Change |
| --- | --- |
| 2026-05-11 | Initial public-review publication; repository created at `phosra-spec/pcss`; Phosra Inc. stewardship documented; Adopter Council formation announced; foundation transition target set for v2.0 (Q4 2026) |

## Questions

- Foundation transition timing: [governance@phosra.com](mailto:governance@phosra.com)
- IPR / patent disclosure: [governance@phosra.com](mailto:governance@phosra.com)
- All other governance questions: open an issue in this repository
