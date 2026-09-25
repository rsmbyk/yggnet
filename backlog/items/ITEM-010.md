---
id: ITEM-010
status: archived
title: 'Cached traces + step replay'
type: feat
priority: P1
effort: L
created: 2026-07-30
updated: 2026-07-30
spec: specs/010-cached-traces-step-replay
branch:
pr:
archived_at: 2026-07-30
archive_reason: released
release_version: 0.21.1
---

# ITEM-010: Cached traces + step replay

## Summary

Show algorithm result first; keep step trace; Show steps replays without re-run.

## Notes

Trace-first ADR. Related: ITEM-009, ITEM-011, ITEM-014.

## Acceptance sketch

- Run shows final result immediately
- Trace stored on the run
- Show steps plays/scrubs cached events without recomputing

## Links

- Spec: [010-cached-traces-step-replay](../../specs/010-cached-traces-step-replay/spec.md)
- Related items: ITEM-009, ITEM-011, ITEM-014.
