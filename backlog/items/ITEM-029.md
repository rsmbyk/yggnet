---
id: ITEM-029
status: ready
title: "Multi-select nodes (and edges)"
type: feat
priority: P1
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-029
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-029: Multi-select nodes (and edges)

## Summary

Support selecting multiple nodes (and edges) so manager and world stay in sync on a multi-id selection. Required foundation for real multi-node groups.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Selection today is single-node only (`selectNode` replaces selection). Related: ITEM-005 / SPEC-005 (later multi-select), ITEM-030 / SPEC-016.

## Acceptance sketch

- User can add/remove nodes from selection via modifier click (or equivalent) in manager and world
- Selection API holds multiple `nodeIds` (and optionally `edgeIds`) without collapsing to one
- Manager list and world highlight stay in sync for the full set
- Clear-selection and single-select still work
- Existing single-select flows (pathfinder A/B, analyze, edit panel) remain usable when one item is selected

## Links

- Spec: [SPEC-029](../../docs/specs/SPEC-029/spec.md)
- Related items: ITEM-005, ITEM-030
- Prior SPEC: [SPEC-005](../../docs/specs/SPEC-005/spec.md)
