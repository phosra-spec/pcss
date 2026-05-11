# PCSS v1.0 Security Considerations

> **Status:** Companion to [`pcss-v1.0.md`](pcss-v1.0.md). Informative throughout except where it restates normative requirements from the main spec. This document does not introduce new normative requirements; it names attacks the editors considered, the spec's mitigations, and open issues the v1.0 review explicitly defers.

Each section cross-references the corresponding clause in the main spec. Several open issues are scheduled for v1.1 (federation, key revocation, pairwise pseudonyms, OS Bearing Producer requirements) and v2.0/v3.0 (post-quantum migration). They are tracked in [Appendix A](#appendix-a--open-issues).

## §1 Threat model

**Actors.**

- **Parent.** Trusted to issue Threshold consent (§5) on behalf of their child; not trusted to fabricate a Bearing.
- **Child.** Adversarial to their own age band; assumed to attempt bearing escalation.
- **Bearing Provider** (e.g., Apple, Google, Yoti). Trusted within the scope of issuing the Bearing it signs, no further. PCSS does not require providers trust one another.
- **Platform implementer** (e.g., Roblox, YouTube). Passes conformance suite but operates a commercial product; may be incentivized to fail-open.
- **Parental-control implementer** (e.g., Bark, Phosra Inc.). May be incentivized to over-block.
- **Regulator.** Trusted to receive receipts; not trusted to inject rules into the Verdict path.
- **Hostile regulator / state actor.** May demand back-doors, key escrow, or deanonymization.
- **On-path attacker** (ISP, hostile network). Can observe, replay, and reorder PCSS traffic.
- **Sibling / household attacker.** Same network, same device pool, attempts impersonation of another household member's Bearing.
- **Supply-chain attacker.** Compromises an SDK, a CI step, or the conformance runner.
- **Malicious adopter.** Passes conformance, then disables enforcement at runtime.

**Assets to protect**, in priority order: (1) child PII — must never appear on the wire at all (§3.2, §10.4); (2) age-band authenticity — the integrity claim that an "adult" Bearing was actually issued by a registered provider; (3) Verdict authenticity — that what was evaluated is what was logged; (4) Receipt non-repudiability — that a regulator can replay a Notary receipt independent of the implementer; (5) parent consent integrity (Threshold §5).

**Attack surfaces.** The Bearing issuance path; the Lens evaluation path; the Notary signing path; the PCSS registry (key directory); the conformance runner; any sidecar telemetry an implementer adds outside the spec.

## §2 Spoofing — forged Bearings

**Attack.** An adversary mints a Bearing with `issuer: "os:apple"`, `age_band: "adult"` for a 12-year-old.

**Mitigation.** Per [`bearing.json`](schema/bearing.json) and §3.2, every Bearing carries an ed25519 signature with a `key_id` that **MUST** resolve to a key published in the PCSS registry under the corresponding issuer prefix. Consumers **MUST** verify per §3.3. The registry is the trust root: a consumer that resolves `key_id` to a public key whose registry record does not match the `issuer` field rejects the envelope.

**Open issue OI-1 (v1.1).** The spec relies on but does not yet normatively specify how the registry itself is operated, who can publish under the `os:` prefix, or what transparency log backs the registry. Bind issuer-prefix admission to a Certificate Transparency–style append-only log so a covert re-issuance under `os:apple` is publicly detectable.

**Federation.** v1.0 takes the simplest posture — flat registry, all issuers peer to one another. There is no signature chain; an `os:` issuer is not "rooted" in anyone. v2.0 should consider a federation model where account-level issuers cross-sign against an OS-level issuer when running on that OS.

## §3 Replay attacks

**Attack.** An on-path attacker captures a Verdict + Receipt pair from January when the rule registry was looser, and replays it in May against a stricter rule.

**Mitigations.** (a) every Verdict carries `evaluated_at` (§9.1); (b) every Receipt carries `issued_at` and an optional `expires_at` (default 7 years per [`receipt.json`](schema/receipt.json)); (c) §10.2 requires that re-execution reproduces the Verdict against the original Bearing — a replayed Verdict cited against today's rule set will fail re-execution because the rule registry is versioned.

**Open issue OI-2 (v1.1, normative).** The spec does not require a request-side nonce on Lens calls; a captured Verdict can be re-served by a hostile implementer to a regulator auditing the implementer (not re-executing). Add `nonce` to the Verdict envelope, bound to the surface request, and require the conformance suite to reject re-served Verdicts whose nonce was previously redeemed. Tolerance window for `evaluated_at` skew: recommend ≤300s, normative in v1.1.

## §4 Key compromise and rotation

**Attack.** An implementer's Notary signing key is exfiltrated. The adversary mints arbitrary receipts.

**Mitigation.** §10.3 mandates annual rotation and registry publication of rotation events; rotated public keys remain in the registry for the receipt's `expires_at` window (default 7 years) so historical receipts remain verifiable.

**Open issue OI-3 (v1.1, normative).** v1.0 has no revocation mechanism. A rotation is voluntary; a known-compromised key cannot be marked "do not trust receipts signed after timestamp T." Add a revocation record format `{key_id, revoked_at, last_known_good_at}`; consumers **MUST** reject receipts whose `issued_at > last_known_good_at`. Until then, implementers **SHOULD** rotate every 90 days, not annually.

**Open issue OI-4 (v1.1).** The spec does not specify HSM / secure-enclave requirements for Notary key storage. Add `key_storage` field to registry entries declaring `hsm`, `enclave`, or `software`.

## §5 Privacy — linkage across surfaces

**Attack.** A `bearing_id` issued by `os:apple` is reused across every consumer surface the child touches; an aggregator joins Roblox, YouTube, and a school filter and rebuilds a per-child timeline.

The spec's [`bearing.json`](schema/bearing.json) says `bearing_id` **MUST NOT** be reused across users but does not prohibit stability per-user across implementers.

**Trade-off.** A stable `bearing_id` enables Threshold revocation propagation (§5.3) and audit replay (§10.2). A per-implementer rotating `bearing_id` defeats cross-surface linkage but makes revocation harder. v1.0 permits either; v1.1 will require pairwise pseudonyms.

**Open issue OI-5 (v1.1, normative).** Require per-consumer pairwise pseudonyms — `bearing_id` is `HKDF(root_bearing, consumer_id)` so the same Bearing presents a different opaque ID to Roblox vs. YouTube, while the Bearing Provider retains the join key for the parent's revocation flow. Until normative, implementers **SHOULD** generate pairwise pseudonyms in implementer guidance.

## §6 Side-channel attacks

**Attack.** Lens (§4) evaluates faster when the resolved `age_band` is `adult` (short-circuit on permissive rules) and slower for minors (more checks). An on-path observer or co-tenant measures evaluation latency and infers the band without ever seeing the Bearing.

**Mitigation guidance** (informative; promote to SHOULD in v1.1). Lens implementations should evaluate constant-time over the full rule set or pad responses with a fixed latency floor (recommend p99 of the minor path). Notary signing is already constant-time at the ed25519 primitive level; the risk is at the rule-evaluation layer.

**Open issue OI-6.** The conformance suite cannot test side-channels directly without timing harnesses. v1.1 conformance Tier-2 may add a timing-attack test category if the WG can settle on a measurement methodology that works across diverse runtime environments.

## §7 Hostile implementer (fail-open)

**Attack.** An implementer passes the conformance suite, then in production configures rule evaluation to default-allow on error, swallowing Lens exceptions and emitting `allow: true` Verdicts with a `lens:internal_ok` reason. §4.2 mandates default-deny on resolution failure — this is the spec's primary defense. But an implementer who lies about which path was hit is undetectable by signature alone.

**Defenses.** (a) the rule registry is versioned and published, so a regulator can re-execute (§10.2) and detect the lie statistically across receipts; (b) Herald (§7) emits to a regulator surface so a discrepancy between an implementer's outcome distribution and the spec's expected distribution is visible.

**Open issue OI-7 (v1.1, normative).** v1.0 has no required sampling rate for regulator-surface receipts. Implementers claiming Tier-A **MUST** route ≥1% of evaluations to the regulator surface for spot replay.

## §8 Hostile regulator / back-door demands

The spec's posture is structural, not legal: receipts carry only `bearing_id` and `verdict_id` (§10.4) and the underlying Bearing carries only `age_band` + `jurisdiction` (§3.2). A regulator demanding to see "the user behind verdict X" is asking for data the spec does not transmit. An implementer pressured to add a sidecar that maps `bearing_id` to identity would be operating outside PCSS; the spec **MUST NOT** be cited as the basis for such a sidecar.

The PCSS Standards Body commits to a public-disclosure norm for back-door requests, parallel to a warrant canary. This commitment lives in [`GOVERNANCE.md`](../GOVERNANCE.md) when the foundation seats.

## §9 Bearing escalation (child obtains parent's Bearing)

**Attack.** A child captures a parent's `adult` Bearing — e.g., by using the parent's unlocked phone — and presents it. The Bearing is cryptographically valid. PCSS cannot solve this at the wire layer; it is an issuance-and-binding problem (see §13).

**Detection guidance** (informative). Bearing Providers **SHOULD** bind Bearings to device-level attestation (Apple App Attest, Android Play Integrity) so a Bearing presented from a device that does not match the issuance device is rejected. Implementers **SHOULD** emit Herald events on `adult` Bearing presented in a household previously seen issuing a `13-15` Bearing — the signal is weak but useful.

**Open issue OI-8 (v1.1, normative).** Add a `device_attestation` field to Bearing envelopes carrying an attestation token from the device platform. Conformance Tier-2 verifies the attestation chain.

## §10 Quantum considerations

ed25519 is not PQ-safe; Shor breaks it. The relevant horizon for cryptographically-relevant quantum is debated, but receipts retain validity for 7 years ([`receipt.json`](schema/receipt.json) `expires_at` default), so a 2026 receipt must verify in 2033.

**Migration plan.** v1.1 adds a hybrid signature suite (ed25519 + ML-DSA / FIPS 204) under a new `alg` enum value; v2.0 makes hybrid mandatory for new Receipts; v3.0 deprecates ed25519-only. The registry already supports multiple keys per `key_id` namespace, so an implementer can dual-sign during transition.

**Open issue OI-9 (v1.1).** Pick the post-quantum primitive. ML-DSA-65 is the v1.1 candidate; the WG should evaluate Falcon and SPHINCS+ alternatives for size/speed trade-offs given that receipts are not interactive.

## §11 Audit log integrity (Custody §8)

The 180-day Custody retention (§8.1) is on the *implementer's* infrastructure — the implementer is both subject and custodian of their own audit log.

**Attack.** An implementer rewrites their own log to delete an incriminating Verdict.

**Defense.** Notary receipts are signed and a copy is on the regulator surface (Herald §7.1); an implementer that deletes from their own log cannot retroactively delete the regulator's copy. Receipts **SHOULD** chain — each receipt includes a hash of the previous receipt's `receipt_id` + `signature`, making selective deletion detectable.

**Open issue OI-10 (v1.1, normative).** Add a `prev_receipt_hash` field to [`receipt.json`](schema/receipt.json) and require append-only operation via the conformance suite.

## §12 Conformance suite as attack surface

A malicious conformance runner is handed signing keys and Bearings to exercise the implementer's code paths.

**Mitigation.** The conformance suite **MUST** use ephemeral test keys generated per run, registered in a `conformance:` issuer prefix that is **MUST NOT**-accepted by production consumers. The suite **MUST NOT** be granted access to the implementer's production Notary key under any circumstance; conformance receipts are signed with a `conformance:<implementer>` key separately published in the registry.

v1.0 leaves this implicit; v1.1 promotes it to normative §11.1 in the main spec.

## §13 Bearing Producer (OS) requirements

For PCSS to be more than security theater, OS-level Bearing Providers (`os:apple`, `os:google`, `os:microsoft`) bear unique trust. Recommended requirements for v1.0; normative in v1.1 (OI-11):

- Bearing signing keys **MUST** be held in a hardware security module or platform secure enclave; never exportable.
- Issuance **MUST** be bound to a verified parent account at the OS layer (e.g., Apple Family Sharing, Google Family Link).
- Presentation **MUST** include a device-attestation token (App Attest / Play Integrity) so a Bearing replayed from a non-issuing device is rejected.
- The Bearing Provider **MUST** support parent-initiated revocation propagating to the consumer ecosystem within the §5.3 freshness window.
- The Bearing Provider **MUST** publish an annual transparency report: count of Bearings issued by band, count revoked, count of registry rotation events.

Account-level providers (`account:roblox`) and third-party verifiers (`verifier:yoti`) are held to a weaker bar in v1.0 — they may rely on software keystores — but **SHOULD** progress toward parity with OS-level providers.

---

## Appendix A — Open issues

| ID | Title | Target version | Spec section affected |
| --- | --- | --- | --- |
| OI-1 | Registry trust root + CT-style log | v1.1 | §3.2, GOVERNANCE.md |
| OI-2 | Verdict nonce + skew tolerance | v1.1 | §9 |
| OI-3 | Key revocation mechanism | v1.1 | §10.3 |
| OI-4 | HSM / enclave requirement for Notary | v1.1 | §10.3 |
| OI-5 | Pairwise pseudonyms for bearing_id | v1.1 | §3.1 |
| OI-6 | Side-channel timing test | v1.1 Tier-2 conformance | §4 |
| OI-7 | Required sampling rate to regulator surface | v1.1 | §7.2, §11 |
| OI-8 | Device attestation field on Bearing | v1.1 | §3.1 |
| OI-9 | Post-quantum primitive selection | v1.1 | §10 |
| OI-10 | Receipt chaining (`prev_receipt_hash`) | v1.1 | §10.1, §11 |
| OI-11 | Normative OS Bearing Producer requirements | v1.1 | §3.2 |

All eleven open issues target v1.1 except where noted. Resolution happens via the [RFC process](../rfcs/README.md).
