---
id: ITEM-010
status: backlog
title: "Cached traces + step replay"
type: feat
priority: P1
effort: L
created: 2026-07-30
updated: 2026-07-30
spec:
branch:
pr:
archived_at:
archive_reason:
release_version:
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

- Spec:
- Related items: ITEM-009, ITEM-011, ITEM-014.
