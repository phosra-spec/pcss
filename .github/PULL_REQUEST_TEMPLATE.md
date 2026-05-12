<!-- One concern per PR — see CONTRIBUTING.md -->

## Summary

<!-- One paragraph: what changed and why. -->

## Type of change

- [ ] Editorial (typo / link / formatting)
- [ ] Schema / wire format
- [ ] Spec prose (`pcss-v1.0.md` or `capabilities/*`)
- [ ] Rule registry (`v1/rules/*`)
- [ ] Bibliography (`v1/references.md`)
- [ ] Governance / process docs
- [ ] Conformance fixtures / runner
- [ ] SDK / reference implementation
- [ ] RFC (links to `rfcs/NNNN-*.md`)
- [ ] Tooling / CI

## Normative impact

- [ ] No normative change (typo / clarification / additive non-required field)
- [ ] Adds MUST / MUST NOT
- [ ] Adds SHOULD / SHOULD NOT / MAY
- [ ] Removes or weakens existing MUST / SHOULD (requires RFC + Council vote)

## Cross-checks

- [ ] JSON Schema validation passes (`ajv validate ...`)
- [ ] `redocly lint v1/openapi.yaml` passes
- [ ] Spec prose and schemas agree on field shapes
- [ ] Capability doc and main spec agree
- [ ] If `enforcement_status: proposed`, the rule carries `advisory: true`

## Affected capability

<!-- Tag at most one of: Charter, Bearing, Lens, Threshold, Aegis, Herald, Custody, Verdict, Notary. -->
