# ADR-005: SemVer on release (sequential SPEC bumps)

## Status

Accepted

## Context

Prefer clear production versions without bumping on every develop merge.

## Decision

- No SemVer change on merge to `develop`
- On release: list SPECs since last prod tag in **merge-to-develop order**; apply each SPEC `bump` sequentially (`none` skips)
- Hotfix SPEC bumps from current `main`
- Tag only on `main`

## Consequences

Example: `0.3.1` + minor, patch, minor, patch → `0.5.1`. Owner may override at release time.
