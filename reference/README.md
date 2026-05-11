# PCSS Reference Implementations

This directory holds **reference implementations** — working, MIT-licensed, deliberately minimal servers that implement the PCSS v1.0 OpenAPI surface. Adopters target these during development; the conformance suite uses them as gold standards.

## Current implementations

- **[server/](server/)** — TypeScript + Fastify. Uses `@phosra/sdk/server` for canonicalization, Lens evaluation, and Notary signing. Status: v0.1 scaffold.

## What "reference" means here

| Reference implementation IS | Reference implementation is NOT |
| --- | --- |
| Working, end-to-end | Optimized for production scale |
| MIT-licensed | The Phosra Inc. backend |
| Minimal, readable | Feature-complete |
| The conformance suite's target | Authoritative — adopters MAY ship a different impl |

The Phosra Inc. production backend (Go, in a private repo) is a separate **implementation** of the spec. The TypeScript server in `server/` is the **reference**. Two different things — adopters benchmark against the reference; Phosra's backend is just another adopter.

## Goals

1. **Pedagogy.** A platform engineer evaluating PCSS for adoption should be able to read this server in 30 minutes and understand the spec better than they would by reading the spec text alone.
2. **Conformance target.** Adopters point `@phosra/conformance` at this server during dev; the green baseline is "the reference passes; my impl should too."
3. **Deployment template.** Adopters fork this server, swap in their auth model and storage, and ship.

## Future implementations (community-contributed)

Once a community port to a different language matches the conformance suite and offers to maintain for ≥1 year, it can land here under its own subdirectory. v1.1 likely candidates: Go, Python, Rust.

Until then, the TypeScript reference is the canonical one. Subscribe to issues tagged `area:reference` for the hosted deployment plan (`reference.pcss.dev`).
