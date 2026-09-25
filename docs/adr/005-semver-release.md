# ADR-005: SemVer on release (sequential SPEC bumps)

## Status

Superseded by [ADR-007](./007-adopt-vexbook.md)

## Context

Prefer clear production versions without bumping on every develop merge.

## Decision

- No SemVer change on merge to `develop`
- On release: list SPECs since last prod tag in **merge-to-develop order**; apply each SPEC `bump` sequentially (`none` skips)
- Hotfix SPEC bumps from current `main`
- Tag only on `main`

## Consequences

Example: `0.3.1` + minor, patch, minor, patch → `0.5.1`. Owner may override at release time.

**Superseded:** after adopting vexbook `v0.4.0`, version identity is repo-root `VERSION` (mirrored in `package.json`), and the spec PR carries the bump when `bump` ≠ `none`. See ADR-007 and [`docs/PROCESS.md`](../PROCESS.md).
