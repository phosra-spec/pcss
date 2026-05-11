---
RFC: 0000
Title: (one-line summary)
Author: (your name + email)
Sponsoring adopter: (Tier-2+ adopter sponsoring this RFC to final-call, or "civil-society sponsorship exempt per CONTRIBUTING.md")
Affected capability: (Charter / Bearing / Lens / Threshold / Aegis / Herald / Custody / Verdict / Notary)
Stage: draft
Stage-start date: YYYY-MM-DD
Tracking issue: (link to GitHub issue)
---

# RFC: (title)

## Summary

One paragraph. The "elevator pitch." Must stand alone — a reader who reads only this paragraph understands what's being proposed and why it matters.

## Motivation

What is the concrete problem this RFC solves? Who feels it? Where is the evidence — a specific incident, a regulator citation, an adopter pain point, a statute change? "Why now?" goes here.

State the user-visible problem in terms a non-implementer can understand. If you cannot, the problem is probably not real or not yet ripe.

## Detailed design

The normative core. This section MUST be sufficient for an implementer to ship the change without reading the rest of the RFC.

Include:

- Schema diffs (additions, modifications, removals; show JSON Schema deltas).
- Capability semantics (what changes about the behavior of `bearing.identify`, `lens.evaluate`, etc.).
- Wire format changes (envelope fields, validation rules, error codes).
- A worked example showing the change in action, end-to-end.
- Migration path (how does an existing v1.0 implementation become compliant).

Use MUST / SHOULD / MAY per RFC 2119. State the conformance level for each change.

## Drawbacks

Why might we not do this? Write against your own proposal. If you cannot name three real drawbacks, the design is probably not specific enough.

## Rationale and alternatives

What is the design space? Why this shape over the alternatives?

- Alternative A: (description, why rejected)
- Alternative B: (description, why rejected)
- Doing nothing: (this MUST be considered explicitly — what breaks if we don't ship this)

## Prior art

What analogous mechanisms exist in W3C, IETF, COPPA, AADC, OFCOM, OS-vendor APIs, or other standards bodies? How do they handle the same problem?

If you cannot find any prior art, that's a flag — most child-safety problems have been considered somewhere; not finding the work usually means not looking hard enough.

## Unresolved questions

Open issues that block final acceptance, each tagged `[blocking-final-call]` or `[post-merge-followup]`.

- [blocking-final-call] (issue that must be resolved before this RFC advances from `final-call` to `accepted`)
- [post-merge-followup] (issue we can address in a follow-up RFC; not a blocker)

## Future possibilities

Out-of-scope extensions that would be natural next steps if this RFC is accepted. Useful for orienting reviewers to the trajectory without committing to a roadmap.

---

*Process notes (delete this section before submitting):*

- *RFC numbers are assigned at merge by the editor; leave the header `RFC: 0000` until then.*
- *Sponsorship is required to advance to `final-call`. Civil-society contributors are exempt per [CONTRIBUTING.md](../CONTRIBUTING.md).*
- *Stages: `draft` → `open` (30-day public comment) → `final-call` (14-day final review) → `accepted` / `rejected` / `postponed`.*
- *File patent/IPR disclosures before reaching `final-call` per [GOVERNANCE.md](../GOVERNANCE.md#interim-ipr-policy).*
