# ADR-007: Adopt vexbook process (v0.4.0)

## Status

Accepted

## Context

Yggnet already used Spec-Driven Development, an ITEM board, Git Flow, and SemVer, but process docs and layout drifted from the shared **vexbook** process template. Owner asked to adopt that process into this existing product repo.

## Decision

- Adopt vexbook process at tag **`v0.4.0`** per [`docs/ADOPT.md`](../ADOPT.md).
- Binding process docs: [`PROCESS.md`](../PROCESS.md), [`KICKOFF.md`](../KICKOFF.md), [`rules/SDD-GATE.md`](../rules/SDD-GATE.md).
- Keep **Git Flow** (already decided in ADR-002).
- Switch SemVer to vexbook rules: repo-root [`VERSION`](../../VERSION) is canonical; `package.json` `version` mirrors it; when `bump` ≠ `none`, the **spec PR is the release** (`VERSION` + changelog section in that PR). Tag `vX.Y.Z` on `main` when the owner cuts production (Git Flow). This **supersedes ADR-005**.
- Spec packs live at `specs/NNN-slug/` (migrated from `docs/specs/SPEC-NNN/`).
- Do not renumber existing product ADRs 001–006.

## Consequences

Agents and humans follow PROCESS + SDD-GATE. Later keep-up uses ADOPT sync (owner-triggered only). First behavior change after adopt still Draft → Accept → implement.
