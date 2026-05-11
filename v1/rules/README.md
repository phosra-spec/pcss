# PCSS Rule Registry — v1.0

> **Status: public review.** First batch of 15 priority rules shipped 2026-05-11. Additional rules land per the [contribution process](../../CONTRIBUTING.md). The registry is licensed CC BY 4.0; you may fork and extend it as long as vendor-prefixed slugs are used per `pcss-v1.0.md §1.2`.

This directory is the canonical machine-readable form of the PCSS rule taxonomy. Every entry validates against [`../schema/rule.json`](../schema/rule.json). Filenames match the `slug` field — no exceptions, enforced by CI.

## How Lens uses this

A Lens evaluator answers "what rule applies?" for a `(Bearing, surface, capability, jurisdiction)` tuple. The evaluator loads all rules whose `capability` matches the request, filters by `jurisdiction` and `applies_to_ages`, and applies the stricter-rule precedence in `pcss-v1.0.md §4.3`. Verdicts cite the rule slug and its statutes.

## The 15 v1.0 priority rules

| Slug | Capability | Default | Statute |
| --- | --- | --- | --- |
| [`kosa_recommender_off_minor`](kosa_recommender_off_minor.json) | lens | deny | KOSA §4(b)(2) + CA-AADC §22675(a)(3) |
| [`kosa_addictive_design_off_minor`](kosa_addictive_design_off_minor.json) | lens | deny | KOSA §4(b)(1) |
| [`coppa_vpc_under13`](coppa_vpc_under13.json) | threshold | deny | COPPA §312.5 |
| [`coppa2_targeted_ad_ban_under17`](coppa2_targeted_ad_ban_under17.json) | lens | deny | COPPA 2.0 §1303(b) |
| [`ca_aadc_default_high_privacy_minor`](ca_aadc_default_high_privacy_minor.json) | threshold | deny | CA-AADC §22675(a)(2) |
| [`ca_ab1043_os_age_signal_consume`](ca_ab1043_os_age_signal_consume.json) | bearing | warn | CA AB 1043 §3 |
| [`ny_s9051_ai_companionship_block_minor`](ny_s9051_ai_companionship_block_minor.json) | aegis | deny | NY S9051 §2 |
| [`eu_dsa_recommender_transparency`](eu_dsa_recommender_transparency.json) | herald | warn | EU DSA Art. 27 |
| [`eu_dsa_minor_targeted_ad_ban`](eu_dsa_minor_targeted_ad_ban.json) | lens | deny | EU DSA Art. 28(2) |
| [`eu_gdpr_age_of_consent_16`](eu_gdpr_age_of_consent_16.json) | threshold | deny | EU GDPR Art. 8 |
| [`uk_oas_age_assurance_high_risk`](uk_oas_age_assurance_high_risk.json) | bearing | deny | UK OSA s. 12 |
| [`uk_aadc_high_privacy_default`](uk_aadc_high_privacy_default.json) | threshold | deny | UK AADC Std. 4 |
| [`csm_nfk_hard_block`](csm_nfk_hard_block.json) | aegis | deny | CSM Privacy Program (civil-society) |
| [`csm_ai_chatbot_tier_gate`](csm_ai_chatbot_tier_gate.json) | lens | deny | CSM AI Ratings 4-tier (civil-society) |
| [`au_oss_age_verification_social`](au_oss_age_verification_social.json) | bearing | deny | AU Online Safety Act amendment 2024 |

## What's intentionally NOT in v1.0

- **The full 87-law Phosra registry** at [phosra.com/compliance](https://www.phosra.com/compliance). Phosra's product registry includes marketing context, MCP snippets, and adopter-onboarding aides that aren't normative for the spec. Rules that are spec-shaped will migrate here over v1.x.
- **Adopter-specific extensions** (Bark, Aura, CSM extended ratings beyond the canonical AI tiers). Adopters MAY publish vendor-prefixed rules; those don't belong in the canonical registry.
- **Statutes superseded or enjoined**: AU OSS amendments 2024 status is tracked at signature time only; the registry doesn't track active injunctions. Adopter Lens implementations are expected to handle jurisdictional enforcement status themselves.

## Adding a new rule

1. Open a draft RFC at [`rfcs/`](../../rfcs/).
2. Reference the statute, the affected capability, and the proposed default outcome.
3. Once accepted, add a new file `<slug>.json` and a corresponding row in this README's table.
4. CI validates the schema + filename match + slug-uniqueness across the registry.

A rule's `default_outcome` is the outcome when the rule applies and no stricter rule overrides it. `applies_to_ages` lists the age bands at which the rule triggers; bands outside this array MUST NOT trigger the rule, even if the jurisdiction matches.
