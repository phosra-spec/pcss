# PCSS RFCs

> **Status: open for submissions.** The RFC process is the canonical mechanism for proposing substantive changes to PCSS — schema additions, new capabilities, new rules, semantic clarifications, governance amendments.

## How to file an RFC

1. Copy [`0000-template.md`](0000-template.md) to `NNNN-short-slug.md` (NNNN is assigned at merge; leave `0000` for the initial PR).
2. Fill in every section. The template's section headings are non-negotiable.
3. Open a draft PR. Tag the affected capability in the PR description so the relevant Working Group is notified.
4. The PR enters `draft` stage. The author owns advancing through stages:
   - `draft` — author iterating; reviewers may comment but the author is not obligated to respond.
   - `open` — 30-day public comment window; author MUST respond to substantive comments.
   - `final-call` — 14-day final review; only changes addressing surfaced blocking issues are permitted.
   - `accepted` / `rejected` / `postponed` — assigned by the relevant WG with Adopter Council ratification for capability-level changes.
5. Sponsorship is required to advance to `final-call`. A Tier-2+ Charter Adopter must sponsor commercial RFCs. Civil-society contributors and academic researchers are sponsorship-exempt per [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

## What needs an RFC

- Schema additions, modifications, or removals.
- New capability surfaces.
- Changes to MUST / SHOULD / MAY language in `pcss-v1.0.md`.
- New rules in `v1/rules/` whose statutory basis is not yet in the registry.
- Governance amendments to [`../GOVERNANCE.md`](../GOVERNANCE.md).
- Conformance test plan changes that affect tier eligibility.

## What does NOT need an RFC

- Typo fixes, broken-link repairs, clarifying examples.
- New rules in `v1/rules/` that codify a statute already cited in the spec.
- Editorial passes on capability docs (`v1/capabilities/*`) that do not change normative behavior.
- Translations of existing English text.

For these, open a normal PR. Non-RFC PRs require one maintainer approval; RFC-affecting PRs require WG sign-off.

## Current RFCs

None yet. The repo is open; the next entry on this list will be the first external clarifying RFC, which we expect to land in Horizon 1 per the [roadmap](../ROADMAP.md#h15).
