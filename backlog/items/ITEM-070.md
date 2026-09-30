---
id: ITEM-070
status: speccing
title: 'Traversal and search algorithms'
type: feat
priority: P1
effort: L
created: 2026-09-30
updated: 2026-09-30
spec: specs/062-traversal-algorithms
branch: feat/062-traversal-algorithms
pr:
archived_at:
archive_reason:
bump: minor
release_version:
---

# ITEM-070: Traversal and search algorithms

## Summary

Expand the unified Analyze laboratory with DFS, Multi-source BFS, Depth-Limited DFS, Iterative Deepening DFS, Bidirectional BFS, and seeded Random Walk. Give systematic traversal definitions both Traverse and Search modes while preserving result-first presentation and showing the explored footprint during Search result reveals.

## Notes

- Existing BFS gains Traverse/Search modes; Dijkstra remains unchanged under Shortest path.
- Bidirectional BFS is Search-only because a target supplies its second frontier.
- Multi-source and bidirectional result reveals expand all active sources/frontiers concurrently by wave.
- IDDFS result reveal visibly restarts for each depth while its displayed metrics remain final and immutable.
- Random Walk exposes an optional seed and reports the actual seed used; revisits use a transient pulse and edge replay, never a node badge.

## Acceptance sketch

- Analyze offers BFS, DFS, Multi-source BFS, Depth-Limited DFS, IDDFS, Bidirectional BFS, Random Walk, and the existing Dijkstra definition.
- Applicable traversal definitions support Traverse and Search modes with generated fields and directed-edge semantics.
- Search Result reveals retain the explored footprint and emphasize the final path without replaying the full instructional Trace.
- Generic reveal phases support concurrent waves, IDDFS restarts, and Random Walk revisits without algorithm-specific UI branches.

## Links

- Spec: [062-traversal-algorithms](../../specs/062-traversal-algorithms/spec.md)
- Related items: ITEM-069
