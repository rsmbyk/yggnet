---
id: ITEM-002
status: archived
title: "Edge weight + directed"
type: feat
priority: P0
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-002
branch: 
pr: 
archived_at: 2026-07-30
archive_reason: released
release_version: 0.21.1
---

# ITEM-002: Edge weight + directed

## Summary

First-class directed flag and numeric weight on edges in the model and manager.

## Notes

Required for Dijkstra/A* and directed trees/orgs. Related: ITEM-001, ITEM-006, ITEM-009.

## Acceptance sketch

- Edges store directed boolean and numeric weight
- Manager can edit direction and weight
- Undirected and directed graphs both supported

## Links

- Spec: [SPEC-002](../../docs/specs/SPEC-002/spec.md)
- Related items: ITEM-001, ITEM-006, ITEM-009.
