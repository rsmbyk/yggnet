---
id: ITEM-011
status: archived
title: "Stale-run invalidation"
type: feat
priority: P1
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-011
branch: 
pr: 
archived_at: 2026-07-30
archive_reason: released
release_version: 0.21.1
---

# ITEM-011: Stale-run invalidation

## Summary

Graph edits mark runs and traces stale until the algorithm is re-run.

## Notes

Related: ITEM-010, ITEM-001, ITEM-024.

## Acceptance sketch

- Editing the graph after a run marks that run stale
- UI indicates stale results clearly
- Re-run refreshes result and trace

## Links

- Spec: [SPEC-011](../../docs/specs/SPEC-011/spec.md)
- Related items: ITEM-010, ITEM-001, ITEM-024.
