# §9 Verdict — algorithmic audit

> **Capability owner:** Verdict-Herald Working Group (chair TBA). **Schema:** [`v1/schema/verdict.json`](../schema/verdict.json). **Normative spec section:** [`pcss-v1.0.md §9`](../pcss-v1.0.md#§9-verdict).

Verdict is the universal output envelope. Every Lens evaluation, every Threshold consent check, and every Aegis hard-block emits a Verdict. It is the single shape that a regulator, auditor, or downstream consumer sees regardless of which capability decided.

## §9.0 Role

Verdict normalizes outputs across capabilities. Without it, a regulator auditing a platform would need three different parsers — one for Lens, one for Threshold, one for Aegis. Instead, every enforcement decision lands in the same envelope: allow/deny, a reason, citations, the underlying Bearing, the moment of evaluation. Verdict is the line where machine output becomes legally cognizable.

## §9.1 Wire format walkthrough

```json
{
  "verdict_id": "vrd_01HXYZ9Q4L9NPRS5WXT3ZUCDEF",
  "allow": false,
  "reason": "lens:recommender_off_minor",
  "cited": ["KOSA-§4(b)(2)", "CA-AADC-§22675(a)(3)"],
  "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
  "evaluated_at": "2026-05-11T18:00:00Z",
  "explanation": "Recommender feeds are disabled for users in age band 10-12 under California AADC and KOSA. The user may still browse chronologically.",
  "surface": "feed-rank",
  "capability": "lens",
  "jurisdictions": ["US-CA", "US"]
}
```

Required: `verdict_id`, `allow`, `reason`, `cited`, `bearing_id`, `evaluated_at`. Strongly recommended: `explanation` (required for non-technical audience exposure), `surface`, `capability`, `jurisdictions`.

## §9.2 Reason-code registry

`reason` codes follow `capability:short-name` grammar (regex `^[a-z]+:[a-z0-9_-]+$`). Canonical reasons:

| Reason code | Capability | Meaning |
| --- | --- | --- |
| `lens:default_deny` | lens | Lens could not resolve a verdict; default-deny per §4.2 |
| `lens:no_applicable_rule` | lens | No rule applied; default-allow |
| `lens:recommender_off_minor` | lens | KOSA + AADC recommender block |
| `lens:targeted_ad_off_minor` | lens | COPPA 2.0 + DSA targeted-ad ban |
| `threshold:vpc_required` | threshold | Action requires VPC; none on file |
| `threshold:consent_missing` | threshold | Scope not granted |
| `threshold:consent_revoked` | threshold | Consent was revoked |
| `aegis:csam` | aegis | CSAM hard block |
| `aegis:gambling-minors` | aegis | Gambling product hard block |
| `aegis:dark-patterns` | aegis | Dark pattern hard block |
| `aegis:age-inappropriate-monetization` | aegis | Loot box / similar hard block |

Vendor reasons use a vendor prefix: `vendor:csm:nfk-flagged`, `vendor:apple:app-store-policy`. The reason-code registry is the index into auditable enforcement classes; once a reason ships in v1.0, it cannot be renamed.

## §9.3 Citation grammar

`cited` is an array of strings. v1.0 accepts short-form citations: `KOSA-§4(b)(2)`, `CA-AADC-§22675(a)(2)`, `COPPA-§312.5`, `EU-DSA-Art.28(2)`, `UK-OSA-s.12`.

v1.1 will tighten to a registry-resolved citation format: `us_kosa§4(b)(2)` where the prefix resolves to a statute file in `v1/statutes/`. Until then, the bibliography in [`v1/references.md`](../references.md) provides the canonical resolution.

`cited` MUST be non-empty for any non-trivial Verdict. A `lens:no_applicable_rule` Verdict MAY have an empty array; every other Verdict MUST cite at least one statute.

## §9.4 Explainability requirement

Every Verdict surfaced to a non-technical audience (parent, end user, court filing) MUST include the `explanation` field. The explanation MUST:

- Be human-readable in the relevant locale (default: jurisdiction's primary language).
- State the outcome plainly ("the recommender feed is disabled").
- Cite the statutory basis in lay terms ("under California's AADC and the federal KOSA bill").
- Reference the user's age band when relevant ("for users age 10-12").
- Be ≤1000 characters.

Verdicts emitted only to machine consumers (downstream Lens evaluators, auditing pipelines) MAY omit `explanation`. The decision is downstream-context-aware: when in doubt, include it.

## §9.5 Producer responsibilities

A Verdict producer (typically Lens; sometimes Threshold or Aegis) MUST:

1. **Produce a deterministic Verdict.** Same inputs → same Verdict modulo `verdict_id` and `evaluated_at`. This is what makes Notary replay (§10.2) possible.
2. **Populate `bearing_id`** referencing the underlying Bearing envelope that grounded the evaluation.
3. **Set `evaluated_at`** to the moment of decision, not the moment of envelope emission.
4. **Cite every applicable statute** in `cited`. Under-citing is a conformance failure.
5. **Set `jurisdictions`** to every jurisdiction whose rules contributed (singleton arrays permitted).

## §9.6 Consumer responsibilities

A Verdict consumer (an enforcement layer, a parental-control app, an auditor) MUST:

1. **Never act on an unsigned Verdict** in production. A Verdict outside a Notary receipt is a draft, not an authority.
2. **Cache with explicit TTL.** Cached Verdicts MUST be invalidated on rule-registry version change.
3. **Re-evaluate on Bearing rotation.** A Verdict bound to an old `bearing_id` does not transfer to a new one.

## §9.7 Lifecycle

```
inputs gathered ──► evaluation ──► verdict emitted ──► (optionally signed) ──► (optionally herald'd)
                                          │
                                          ▼
                                      immutable
```

A Verdict is immutable. Any mutation (adding fields, changing `cited`) produces a new Verdict with a new `verdict_id`. Mutations after Notary signing break the signature.

## §9.8 Edge cases

- **Partial allow.** A Verdict that allows with restrictions (e.g., allow recommender feed but only chronologically). Express via `allow: true` plus an `extensions.restrictions` array; the downstream consumer is responsible for honoring restrictions.
- **Verdict for ineligible surface.** If the surface doesn't exist or doesn't apply to the capability, return `allow: false`, `reason: lens:default_deny`, citing the request defaults — never silently allow on a surface mismatch.
- **Conflicting jurisdictions array.** When two jurisdictions both contributed but with different outcomes, `jurisdictions` lists both; `reason` reflects the stricter outcome per §4.3.

## §9.9 Interop

| Capability | Interaction |
| --- | --- |
| Bearing (§3) | Every Verdict references a `bearing_id`. |
| Lens (§4) | Lens is the primary Verdict emitter. |
| Threshold (§5) | Threshold checks emit Verdicts with `capability: threshold`. |
| Aegis (§6) | Aegis blocks emit Verdicts with `capability: aegis` and `allow: false`. |
| Notary (§10) | Every Verdict CAN be signed by Notary; Tier-A Charter Adopters MUST sign every one. |
| Herald (§7) | High-impact Verdicts (Aegis, default-deny chains, conformance-affecting outcomes) are heralded. |

## §9.10 Implementer checklist

- [ ] Verdicts validate against [`v1/schema/verdict.json`](../schema/verdict.json).
- [ ] Reason codes match the canonical registry (or carry vendor prefix).
- [ ] `cited` is non-empty on every blocking Verdict.
- [ ] `evaluated_at` is the evaluation moment, not the emission moment.
- [ ] `explanation` populated for parent/regulator-facing Verdicts.
- [ ] Same inputs produce the same Verdict (determinism); test in conformance suite.
- [ ] Verdicts are immutable post-emission.

## §9.11 Statute mappings

| Statute | Verdict relevance |
| --- | --- |
| EU DSA Art. 27 | Algorithmic transparency — Verdict's `reason` + `cited` provide the disclosed parameters. |
| KOSA §6 | Annual independent audit — Verdict stream is the audit corpus. |
| CA-AADC §22675(a)(2) | Default-high-privacy posture — Verdicts demonstrate enforcement. |
| GDPR Art. 22 | Right to explanation of automated decisions — `explanation` field is the response. |

## §9.12 Common mistakes

1. **Omitting `cited`.** A blocking Verdict without statutory citation is unauditable; treated as a conformance failure.
2. **Hand-writing reason strings.** "no recommender for kids" is not a valid reason; use the registered slug `lens:recommender_off_minor`.
3. **Mutating a Verdict after emission.** Adds a field to extensions, changes the `cited` array — this is a different Verdict with a different `verdict_id`. Sign over what you mean.
4. **Truncating `explanation` to fit a UI.** The explanation is the legal record; the UI can summarize, but the Verdict carries the full text up to 1000 characters.
5. **Missing `jurisdictions`.** A Verdict with no jurisdiction is unauditable across borders; even a singleton-jurisdiction Verdict MUST populate the array.
