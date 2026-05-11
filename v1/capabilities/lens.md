# §4 Lens — tier gating

> **Capability owner:** Lens/Enforcement Working Group (chair TBA). **Schema:** consumes [`bearing.json`](../schema/bearing.json), emits [`verdict.json`](../schema/verdict.json). **Normative spec section:** [`pcss-v1.0.md §4`](../pcss-v1.0.md#§4-lens).

Lens evaluates "what rule applies?" for a `(Bearing, surface, capability, jurisdiction)` tuple and emits a Verdict. Lens is the multi-dimensional tier-gating layer: a single Lens evaluation can cover content classification, privacy posture, AI/algorithmic exposure, and commerce restrictions.

## §4.0 Role

Lens is the rule-application engine. It loads the [rule registry](../rules/), filters by the inbound request, applies the stricter-rule precedence (§4.3), and returns a Verdict. Lens is consumer-side: every platform, every parental-control app, every OS that gates a surface runs a Lens evaluator. The spec standardizes the envelope, not where the compute happens.

## §4.1 Wire format walkthrough

Lens request:

```json
{
  "bearing": { "...": "bearing envelope per §3" },
  "surface": "feed-rank",
  "capability": "recommender",
  "jurisdiction": "US-CA"
}
```

Lens response (Verdict, per §9):

```json
{
  "verdict_id": "vrd_01HXYZ9Q4L9NPRS5WXT3ZUCDEF",
  "allow": false,
  "reason": "lens:recommender_off_minor",
  "cited": ["KOSA-§4(b)(2)", "CA-AADC-§22675(a)(3)"],
  "bearing_id": "brng_01HXYZ7P3K8MNQR4VWS2YTBCDE",
  "evaluated_at": "2026-05-11T18:00:00Z",
  "explanation": "Recommender feeds are disabled for users in age band 10-12 under California AADC and KOSA. Chronological feed available.",
  "surface": "feed-rank",
  "capability": "lens",
  "jurisdictions": ["US-CA", "US"]
}
```

## §4.2 Surface registry

Every Lens evaluation cites a surface. The canonical v1.0 surfaces:

| Surface | Description |
| --- | --- |
| `feed-rank` | Algorithmic recommendation feeds |
| `dm-inbound` | Direct messages received |
| `dm-outbound` | Direct messages sent |
| `purchase-flow` | Commerce surfaces with monetary commitment |
| `chatbot` | Conversational AI, including companion-style products |
| `livestream` | Live audio/video streams |
| `search` | Search query + result + autocomplete |
| `account-creation` | Signup and onboarding |
| `ugc-upload` | User-generated content upload |
| `notification` | Push, email, in-product notifications |

Implementers MAY register vendor-prefixed surfaces (e.g., `apple:appstore:rating-prompt`). Vendor surfaces MUST NOT redefine canonical surface semantics.

## §4.3 Consumer-capability axis

A surface is *where* the action happens; `capability` is *what* the user is trying to do:

| Capability value | Use |
| --- | --- |
| `recommender` | Algorithmic ranking, "for you" feeds |
| `messaging` | Direct or group message delivery |
| `commerce` | Spend, subscribe, gift |
| `content-feed` | Chronological or curated content streams |
| `chatbot` | AI conversational interaction |
| `ugc-upload` | Publishing content to a feed |
| `data-collection` | Logging, analytics, profile enrichment |
| `notification` | Initiating an out-of-band message to the user |

A single surface may host multiple capabilities. A platform's "feed-rank" surface evaluated with `capability: recommender` triggers KOSA §4(b)(2); the same surface evaluated with `capability: data-collection` triggers different rules (CA-AADC §22675(a)(8)).

## §4.4 Evaluation algorithm

Pseudocode:

```
function lensEvaluate(bearing, surface, capability, jurisdiction):
    rules = ruleRegistry.load()
    applicable = []
    for rule in rules:
        if rule.capability != "lens": continue
        if not jurisdictionApplies(rule, bearing, jurisdiction): continue
        if not ageApplies(rule, bearing.age_band): continue
        if not surfaceApplies(rule, surface, capability): continue
        applicable.append(rule)

    if applicable is empty:
        return Verdict(allow=true, reason="lens:no_applicable_rule")

    outcome = mergeStricter(applicable)  # §4.3 of spec
    return Verdict(
        allow=(outcome.action == "allow"),
        reason=outcome.canonicalReason(),
        cited=[r.statutes for r in applicable],
        jurisdictions=uniqueJurisdictions(applicable)
    )
```

Determinism is normative. Given the same `(bearing, surface, capability, jurisdiction)` and the same rule registry version, every conformant Lens MUST produce the same Verdict modulo `verdict_id` and `evaluated_at`. This is why Notary replay (§10.2) works.

## §4.5 Default-deny

When Lens cannot resolve a verdict (missing bearing, unknown surface, expired signature, ambiguous conflict per §4.3.4), the implementation MUST return a Verdict with `allow: false`, `reason: "lens:default_deny"`, and the applicable jurisdictional default in `cited`. HTTP returns 200 with this Verdict; 422 is reserved for syntactically invalid requests.

Default-deny is non-negotiable. Implementers MUST NOT fail-open under any circumstance, including degraded service, budget-driven rate-limiting, or partial outage of the rule registry.

## §4.6 Conflict resolution

When two or more jurisdictional rule sets apply, Lens applies the strictest combined outcome. See [`pcss-v1.0.md §4.3`](../pcss-v1.0.md#§43-conflict-resolution) for the seven-subsection treatment including the applicability rules, stricter-rule order, orthogonal-axis conflicts, tie-breaking, and worked example.

## §4.7 Edge cases

- **Missing surface.** Default-deny with `reason: "lens:default_deny"`. The verdict's `jurisdictions` array carries the request's jurisdiction.
- **Surface declared but capability not.** Treat as missing surface; default-deny.
- **Multi-tenant routing.** A platform serving multiple jurisdictions from a single Lens evaluator MUST scope rules per-tenant; cross-tenant rule leakage is a conformance failure.
- **Stale rule registry.** If the registry version is older than 7 days, the implementer SHOULD emit a Herald event and continue evaluating; if older than 30 days, the implementer MUST default-deny until the registry is refreshed.

## §4.8 Interop with other capabilities

| Capability | Interaction |
| --- | --- |
| Bearing (§3) | Lens requires a valid Bearing on every request. |
| Threshold (§5) | Lens consults Threshold for consent-gated rules; an active VPC may flip a Verdict from deny to allow. |
| Aegis (§6) | Aegis PREEMPTS Lens. An Aegis hard-block returns before Lens evaluates. |
| Verdict (§9) | Lens is the primary Verdict emitter. |
| Notary (§10) | Lens Verdicts are typically signed by Notary; Tier-A Charter Adopters sign every one. |
| Herald (§7) | Significant Lens outcomes (denials, conflicts, registry-version drift) are emitted to Herald. |

## §4.9 Implementer checklist

- [ ] Loaded rules from `v1/rules/` and verified each validates against [`v1/schema/rule.json`](../schema/rule.json).
- [ ] Implemented `/lens/evaluate` per [`v1/openapi.yaml`](../openapi.yaml).
- [ ] Registered surfaces (canonical + any vendor-prefixed) in your implementer manifest.
- [ ] Default-deny on every error path including network failures.
- [ ] Returned the `jurisdictions` array on every Verdict, including single-jurisdiction cases.
- [ ] Cached rule registry with versioned invalidation.
- [ ] Emitted Herald events on `lens:default_deny` Verdicts citing two contradictory rules.

## §4.10 Statute mappings

The Lens-capability rules in [`v1/rules/`](../rules/) cite their statutes inline. Top mappings:

| Rule | Statute |
| --- | --- |
| `kosa_recommender_off_minor` | KOSA §4(b)(2), CA-AADC §22675(a)(3) |
| `kosa_addictive_design_off_minor` | KOSA §4(b)(1) |
| `coppa2_targeted_ad_ban_under17` | COPPA 2.0 §1303(b) |
| `eu_dsa_minor_targeted_ad_ban` | EU DSA Art. 28(2) |
| `csm_ai_chatbot_tier_gate` | CSM AI Ratings 4-tier |

## §4.11 Common mistakes

1. **Fail-open on registry fetch error.** v1.0's primary safety invariant is default-deny. Caching the last-good registry and applying it is fine; allowing all on a fetch error is a conformance failure.
2. **Ignoring the stricter-rule merge.** Implementers sometimes pick "the first applicable rule" instead of merging strictness across jurisdictions. This produces non-deterministic Verdicts and breaks Notary replay.
3. **Hardcoding US-only rule sets.** A platform that operates in EU but evaluates only US rules will miss DSA Art. 28(2) and fail Custodian conformance.
4. **Surface name drift.** `feed-rank` and `feed_rank` are different surfaces under the schema regex `^[a-z][a-z0-9_-]*$`. Pick one (the canonical surfaces use hyphens) and stick to it.
5. **Mutating Verdicts.** A Verdict is immutable once emitted. Any post-evaluation modification (adding fields, changing `cited`) breaks the Notary signature.
