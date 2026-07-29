# ADR-006: AlgorithmRunner (worker-ready)

## Status

Accepted

## Context

Heavy algorithms may block the UI later; call sites should not change.

## Decision

- Algorithms run against **serializable document snapshots**
- `AlgorithmRunner` interface; **`MainThreadRunner`** now; Worker runner later
- Trace/result must be structured-clone safe

## Consequences

Slight indirection today; enables off-main-thread analyze without rewriting session/UI.
