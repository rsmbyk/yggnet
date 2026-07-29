# ADR-003: Trace-first algorithms

## Status

Accepted

## Context

Users want algorithm results immediately and optional step-by-step “thought process” without re-running.

## Decision

- Every algorithm returns `{ result, trace }`
- UI shows **result first**; trace is **cached** on the Run for replay
- Graph edits **invalidate** (stale) runs/traces
- `bump: none` allowed for SPECs that must not move SemVer

## Consequences

Algo implementations emit events; storage grows with traces; huge graphs need caps later.
