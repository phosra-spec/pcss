# Contributing to PCSS

PCSS is an open specification. Contributions are welcome from anyone — implementers, regulators, civil society, researchers, and users.

There are three ways to contribute:

1. **Open an issue** — for typos, clarifications, questions, or reports of inconsistency between sections.
2. **Draft an RFC** — for substantive changes (new capabilities, new rule categories, breaking changes to existing wire formats).
3. **Implement** — and report what was hard.

## Filing an issue

Before opening an issue, search [existing issues](https://github.com/phosra-spec/pcss/issues) to avoid duplicates.

Useful issue templates:
- **Editorial fix** — typo, broken link, unclear sentence. Tag `editorial`.
- **Clarification request** — "What does §X.Y mean in the case of...?" Tag `clarification`.
- **Implementation friction** — "I tried to implement §X and ran into..." Tag `implementation`.
- **Conformance question** — "Does my implementation pass test case T-NNN?" Tag `conformance`.

Most editorial fixes can be closed as a pull request without an RFC.

## RFC process

For substantive changes — anything that affects the wire format, capability semantics, or normative MUST/MUST NOT statements — file an RFC.

### Stages

```
draft  →  open  →  comment  →  final-call  →  accepted  /  rejected  /  postponed
```

| Stage | Duration | What happens |
| --- | --- | --- |
| **draft** | open-ended | Author writes the RFC. No comments required. |
| **open** | min 7 days | RFC merged as a draft into `rfcs/`. Comments invited. |
| **comment** | min 30 days | Formal public-comment window. Authors revise the RFC. |
| **final-call** | 14 days | Authors freeze the RFC. Council members register votes. |
| **accepted** | — | Council vote passes. RFC merged into the relevant spec section. |
| **rejected** | — | Council vote fails. RFC stays in repo as historical record. |
| **postponed** | — | Author or Council defers. May be revived later. |

### RFC format

Place a new file at `rfcs/NNNN-short-slug.md` (NNNN is the next sequential 4-digit number).

```markdown
# RFC NNNN: Short title

**Status: draft / open / comment / final-call / accepted / rejected / postponed**
**Author: Name <email>**
**Sponsoring adopter (if any): Org name (Tier 2+)**
**Stage start: YYYY-MM-DD**

## Summary
One-paragraph overview. What does this RFC propose?

## Motivation
Why does this need to happen? What concrete problem does it solve?

## Proposal
The actual proposed change — spec text, schema diff, capability semantics.

## Backwards compatibility
Does this break existing implementations? What's the migration path?

## Alternatives considered
What other approaches were considered and why were they rejected?

## Open questions
Anything the author isn't sure about and wants Council input on.
```

### Sponsorship

RFCs do not require sponsorship to be filed. Anyone can open a draft.

However, RFCs that propose breaking changes or new normative requirements require a sponsoring Tier-2-or-higher adopter to advance to the `final-call` stage. This is to ensure that proposed changes have at least one adopter committed to implementing them.

Civil-society contributors are exempt from the sponsorship requirement — see [GOVERNANCE.md](GOVERNANCE.md).

## Pull requests

For editorial changes, open a PR directly. PRs:

- Should link to a related issue when one exists.
- Should not bundle editorial and substantive changes. One concern per PR.
- Will be reviewed by a Phosra maintainer (during v1.0 public review) and by a Council member (after v2.0).
- Are merged when CI passes (currently: link-check, schema-validate, OpenAPI lint).

## Code of conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/) v2.1. The full text is in [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

Discussions on PCSS are technical. Personal attacks, harassment, and bad-faith argumentation are not permitted. The maintainers reserve the right to lock issues, remove comments, and ban contributors who repeatedly violate the code.

## Patent and IPR disclosure

By contributing to PCSS, you grant a perpetual, royalty-free, irrevocable patent license to any of your patent claims essential to implementing the contributed text. If you cannot grant such a license (for example, because your employer holds the patent), you must disclose this before the RFC is accepted.

See [GOVERNANCE.md § IPR policy](GOVERNANCE.md#ipr-policy-interim-until-foundation-transition) for details.

## Conformance

If you're implementing PCSS and want to claim conformance, the test plan lives in [`v1/conformance/`](v1/conformance/). Currently the test plan is stub-form; expect substantive test cases by 2026-08.

To list your implementation in the [Adopter Registry](https://www.phosra.com/registry), follow the registry submission process at [phosra.com/registry](https://www.phosra.com/registry).

## Maintainers

- [@jakekklinvex](https://github.com/jakekklinvex) — founding maintainer, Phosra Inc.

Maintainer list will expand as the Adopter Council seats and Working Group chairs are filled (target: 90 days from v1.0 public-review publication).

## Questions

- General: open an issue in this repository.
- Sensitive: [governance@phosra.com](mailto:governance@phosra.com)
- Security: see [SECURITY.md](SECURITY.md) (forthcoming).
