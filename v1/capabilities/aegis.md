# §6 Aegis — hard blocks

> **Capability owner:** Lens-Aegis Working Group (chair TBA). **Schema:** emits [`verdict.json`](../schema/verdict.json) with `allow: false`. **Normative spec section:** [`pcss-v1.0.md §6`](../pcss-v1.0.md#§6-aegis).

Aegis specifies the non-negotiable block surface: actions that are denied for minors regardless of jurisdiction, regardless of Threshold consent. Aegis bypasses Lens conflict resolution; its outcomes are absolute.

## §6.0 Role

Aegis is the absolute-denial layer. Where Lens (§4) says "what rule applies?", Aegis says "this is forbidden, full stop." The Aegis verdicts are categorical, statutorily-grounded prohibitions that don't get weighed against jurisdictional rules — they preempt them.

## §6.1 Wire format walkthrough

Aegis request:

```json
{
  "bearing": { "...": "bearing envelope per §3" },
  "category": "csam",
  "content": { "...": "implementation-specific content reference" }
}
```

Aegis response (always `allow: false`):

```json
{
  "verdict_id": "vrd_01HXYZ9Q4L9NPRS5WXT3ZUCDEF",
  "allow": false,
  "reason": "aegis:csam",
  "cited": ["18-U.S.C.-§2258A"],
  "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
  "evaluated_at": "2026-05-11T18:00:00Z",
  "explanation": "This content is reportable under federal law. The user has been blocked and a report has been filed with NCMEC.",
  "capability": "aegis",
  "jurisdictions": ["US"]
}
```

## §6.2 Category catalog

v1.0 defines four canonical Aegis categories. The rule registry [`v1/rules/`](../rules/) extends with civil-society-defined categories (e.g., `csm_nfk_hard_block`). A Verdict's `reason` is `aegis:<category>`.

### `aegis:csam` — Child Sexual Abuse Material

Statutory basis: 18 U.S.C. §2258A (US mandatory reporting); CSAM is universally prohibited.

Flow:

1. Implementer detects suspected CSAM via hash match (NCMEC PhotoDNA, Thorn, etc.) or ML classification.
2. Aegis returns `allow: false, reason: aegis:csam` immediately.
3. Implementer MUST file a CyberTipline report with NCMEC within statutory window (US).
4. Implementer MUST preserve the evidence per §8.1 statutory-basis retention (90-day NCMEC preservation MUST be cited).
5. Implementer MUST emit a Herald event to the `regulator` surface with cadence `immediate`.

### `aegis:gambling-minors`

Statutory basis: UIGEA (US), national gambling licenses, age-restricted classifications by jurisdiction.

Any gambling product (real-money wagering, casino-style mechanics including loot boxes where statutorily classified) is denied for `age_band` below `adult`. The denial is absolute even if the parent has issued a Threshold envelope granting access — gambling consent for minors is not a parent's gift to give.

### `aegis:dark-patterns`

Statutory basis: FTC Act §5 (US), EU DSA Art. 25 (EU), CA-AADC §22675(a)(2) (CA).

Hard blocks for: subscription dark patterns (auto-renew without disclosure), hidden cancellation flows requiring more steps than signup, manipulative urgency triggers (false "time-limited" prompts to minors), persuasive design patterns explicitly designed to override deliberate choice.

### `aegis:age-inappropriate-monetization`

Statutory basis: KOSA §4(b)(4) (when enacted), Belgium Gaming Commission decision 2018 (loot boxes), Netherlands Gaming Authority decision 2018, China Game Approval Office regulations.

Loot boxes and randomized-reward purchase mechanics targeting users with `age_band` below `adult` in jurisdictions where statutorily prohibited. The jurisdictional patchwork is significant — what's prohibited in Belgium may be permitted in Texas — so this category uses the union of prohibitions, not the intersection (see §6.3 below).

## §6.3 Union vs. intersection semantics

Aegis preempts Lens conflict resolution. Where a Lens rule applies the *stricter* of multiple jurisdictions, Aegis applies the *union* of prohibitions: if any registered jurisdiction prohibits the action for the user's age band, Aegis denies.

This is the opposite of permissive trade — Aegis errs hard toward protection. The justification: hard-block categories represent agreed-upon child-protection floors; jurisdictions that don't yet prohibit are typically lagging the policy consensus, not affirmatively permitting.

## §6.4 Mandatory-reporting flow

For categories with statutory reporting (currently only `aegis:csam`):

```
detection ──► Aegis verdict ──► block enforced
    │                                │
    ▼                                ▼
NCMEC report                  evidence preservation
    │                                │
    ▼                                ▼
Notary receipt              Herald regulator stream
```

Implementers MUST NOT skip the report path for performance reasons. The Notary receipt MUST be retained per §8.1 statutory-basis preservation; the report's submission timestamp MUST be recorded in the receipt's `extensions.ncmec_report_id` field.

## §6.5 Producer responsibilities

A platform implementing Aegis MUST:

1. **Detection vendor neutrality.** Use any reputable detection vendor; PCSS doesn't mandate one. NCMEC PhotoDNA, Thorn Safer, Microsoft PhotoDNA, Google Content Safety API, etc. are all acceptable for `aegis:csam`.
2. **False-positive escalation path.** Have a human reviewer for borderline classifications. A child posting their own bath photo MUST NOT trigger the same response as a flagged CSAM hash.
3. **Statutory reporter status.** US-operating implementers MUST be registered as "electronic service providers" with NCMEC where required by 18 U.S.C. §2258A.
4. **Preservation of evidence.** Aegis verdicts citing CSAM MUST preserve the evidence per the 90-day NCMEC window; deletion overrides under §8.2 are denied.

## §6.6 Consumer responsibilities

A consumer of an Aegis verdict (a platform's enforcement layer, a parental-control app subscribing to Herald):

1. **Never override an Aegis verdict** with a Threshold consent. Parents cannot consent to CSAM access or gambling for their minor; the spec rejects such Thresholds.
2. **Surface to Herald** on the regulator surface immediately. Civil-society stream subscribers receive a redacted version (no content references, only the `aegis:<category>` reason).
3. **Respect evidence retention.** Even when a deletion request arrives via Custody (§8), Aegis-CSAM evidence is preserved per statute.

## §6.7 Lifecycle and extensibility

Aegis categories are immutable additions in v1.0. A category may be ADDED in a minor version with 90-day public-review and Adopter Council ratification. A category may be DEPRECATED only at a major version with 18-month notice. A category MUST NOT be removed silently.

The civil-society-defined categories (e.g., `csm_nfk_hard_block`) follow the same lifecycle but with the originating civil-society body as the sponsor for the addition RFC.

## §6.8 Edge cases

- **Content not visible to Aegis.** E2E-encrypted messaging cannot be scanned without breaking the encryption. The spec doesn't require client-side scanning; implementers operating E2E surfaces are exempt from Aegis CSAM detection at the platform layer (still subject to NCMEC reporting when content is reported by recipients).
- **Miscategorization appeals.** A blocked user (or their parent) MUST have an appeal path; the appeal is out-of-band of PCSS but the verdict MUST carry an `extensions.appeal_url` field where one exists.
- **Civil-society vs. law-enforcement disclosure split.** The civil-society Herald surface receives the categorical reason; only the regulator surface receives content-specific references.

## §6.9 Implementer checklist

- [ ] Integrated a reputable detection vendor for each declared Aegis category.
- [ ] Implemented `/aegis/check` per [`v1/openapi.yaml`](../openapi.yaml).
- [ ] Registered as an NCMEC electronic service provider (US implementers handling user-uploaded media).
- [ ] Wired Aegis verdicts to immediate-cadence Herald regulator stream.
- [ ] Preserved Aegis-CSAM evidence per §8.1 statutory basis.
- [ ] Provided a human-review escalation path for borderline classifications.
- [ ] Refused all Threshold envelopes attempting to consent to Aegis-blocked actions.

## §6.10 Statute mappings

| Category | Primary statute |
| --- | --- |
| `aegis:csam` | 18 U.S.C. §2258A (US); EU DSA Art. 28 (EU); UK OSA Schedule 6 (UK) |
| `aegis:gambling-minors` | UIGEA (US); national gambling licenses |
| `aegis:dark-patterns` | FTC Act §5 (US); EU DSA Art. 25 (EU); CA-AADC §22675(a)(2) (CA) |
| `aegis:age-inappropriate-monetization` | KOSA §4(b)(4) (US, pending); Belgium Gaming Commission 2018 |
| `csm_nfk_hard_block` | Common Sense Media Privacy Program (civil-society) |
| `ny_s9051_ai_companionship_block_minor` | NY S9051 §2 (US-NY) |

## §6.11 Common mistakes

1. **Treating Aegis as a Lens variant.** Aegis is preemptive. If you evaluate Lens before Aegis on an Aegis-triggering input, you've broken the safety invariant.
2. **Allowing Threshold to override Aegis.** Parents cannot consent to CSAM access. The spec rejects such consents at envelope ingestion.
3. **Skipping the NCMEC report.** A CSAM-detected event without a CyberTipline report is a statutory violation, not just a PCSS conformance failure.
4. **Deleting Aegis-CSAM evidence on user request.** Custody (§8) deletion requests do not override 18 U.S.C. §2258A preservation. The deletion is deferred with citation.
5. **Civil-society surface receiving raw content.** The civil-society Herald stream gets reasons and metadata only; the regulator surface gets the full receipt.
