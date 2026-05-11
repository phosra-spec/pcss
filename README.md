# Phosra Child Safety Specification (PCSS)

**Status: v1.0 · public review · 2026-05**
**License: CC BY 4.0**

The Phosra Child Safety Specification (PCSS) is the open interoperability standard for child online safety. One specification, defined once, so a parent's choice on any app, OS, or router is honored across every surface a child touches.

PCSS is drafted, hosted, and stewarded by the [Phosra Standards Body](https://www.phosra.com). It is published under CC BY 4.0 so adopters can implement, fork, and extend the spec without license friction. The spec is moving toward independent foundation stewardship — see [GOVERNANCE.md](GOVERNANCE.md).

## What's in this repository

| Path | Contents |
| --- | --- |
| [`v1/pcss-v1.0.md`](v1/pcss-v1.0.md) | The canonical specification document |
| [`v1/openapi.yaml`](v1/openapi.yaml) | OpenAPI 3.1 surface for the `@phosra/sdk` interface |
| [`v1/schema/`](v1/schema/) | JSON Schema for every wire-format envelope (receipts, bearings, verdicts, rule entries) |
| [`v1/capabilities/`](v1/capabilities/) | One document per named capability (Charter, Bearing, Lens, Threshold, Aegis, Herald, Custody, Verdict, Notary) |
| [`v1/conformance/`](v1/conformance/) | Conformance test plan and test cases (stubs) |
| [`examples/typescript/`](examples/typescript/) | Minimal worked example: bearing → lens → notary flow |

## What "v1.0 public review" means

This is **not** a ratified standard. The text in `v1/pcss-v1.0.md` is the current canonical draft, and the JSON Schemas and OpenAPI surface in this repository are the machine-readable form of that draft. Public review is open until governance transitions to an independent body; once that transition is complete and the Charter Adopter cohort closes (target: Q3 2026), v1.0 will be eligible for ratification.

In practical terms:
- The spec's surface (capability names, rule registry shape, receipt envelope) is stable enough to implement against.
- Breaking changes during public review require an RFC and a 30-day comment window (see [CONTRIBUTING.md](CONTRIBUTING.md)).
- Adopters who implement against the public-review version will be eligible for Charter status when v1.0 ratifies.

## The nine capabilities

PCSS defines nine named capabilities. Every rule in the spec maps to exactly one.

| § | Capability | Role |
| --- | --- | --- |
| §1 | [Charter](v1/capabilities/charter.md) | The specification itself, governance-stamped |
| §3 | [Bearing](v1/capabilities/bearing.md) | Age signals — true north for any user |
| §4 | [Lens](v1/capabilities/lens.md) | Tier gating across content, privacy, and AI |
| §5 | [Threshold](v1/capabilities/threshold.md) | Parental consent and access boundaries |
| §6 | [Aegis](v1/capabilities/aegis.md) | Hard blocks: CSAM, gambling, dark patterns |
| §7 | [Herald](v1/capabilities/herald.md) | Notifications, reports, and alerts |
| §8 | [Custody](v1/capabilities/custody.md) | Data minimization and deletion rights |
| §9 | [Verdict](v1/capabilities/verdict.md) | Algorithmic audit and transparency |
| §10 | [Notary](v1/capabilities/notary.md) | Signed events; regulator-ready receipts |

§2 (Premise) is the spec's preamble and is part of `pcss-v1.0.md`.

## Reading the spec

The fastest path:

1. Read the [canonical document](v1/pcss-v1.0.md) — about a 25-minute read.
2. Skim the [OpenAPI surface](v1/openapi.yaml) to see the runtime contract.
3. Read [`v1/schema/receipt.json`](v1/schema/receipt.json) — the receipt envelope is the linchpin of the spec.
4. Run the [TypeScript example](examples/typescript/) — bearing → lens → notary in roughly 40 lines.

## Implementing PCSS

PCSS does not gate implementation. Anyone can read, implement, and extend the spec. To be listed as a Charter Adopter, see the [Adopter Registry](https://www.phosra.com/registry).

The reference SDK lives at [`github.com/phosra-spec/sdk-typescript`](https://github.com/phosra-spec/sdk-typescript) (forthcoming during the public-review period).

## Contributing

PCSS uses an RFC-style process. To propose changes:

1. Open an issue describing the problem.
2. If the change is non-trivial, draft an RFC under `rfcs/` and open a pull request.
3. RFCs require a 30-day comment window.
4. Breaking changes during public review require Adopter Council ratification.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

PCSS is licensed under [Creative Commons Attribution 4.0 International](LICENSE) (CC BY 4.0). You may copy, redistribute, adapt, and use this specification for any purpose — including commercial — provided you give appropriate credit, link to the license, and indicate if changes were made.

## Contact

- Open an issue: [github.com/phosra-spec/pcss/issues](https://github.com/phosra-spec/pcss/issues)
- Phosra Standards Body: [phosra.com](https://www.phosra.com)
- Email: hello@phosra.com

The standard does not wink.
