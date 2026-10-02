---
id: ITEM-075
status: done
title: 'Informed point-to-point shortest paths'
type: feat
priority: P1
effort: L
created: 2026-10-01
updated: 2026-10-02
spec: specs/067-informed-shortest-path/spec.md
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-075: Informed point-to-point shortest paths

## Summary

Add A* and Bidirectional Dijkstra to Analyze for non-negative point-to-point search.

## Notes

- A* uses a safe scaled straight-line heuristic and explains that behavior in its helper text.

## Acceptance sketch

- Both algorithms return an optimal path and expose their frontiers in Trace.

## Links

- Spec: [SPEC-067](../../specs/067-informed-shortest-path/spec.md)
- Related items: ITEM-069
