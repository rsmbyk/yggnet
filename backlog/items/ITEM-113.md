---
id: ITEM-113
status: in_review
title: 'Clear stale direction cones on graph replacement'
type: fix
priority: P1
effort: M
created: 2026-10-02
updated: 2026-10-02
spec: 105-graph-replacement-arrow-cleanup
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: patch
release_version: 0.41.0
---

# ITEM-113: Clear stale direction cones on graph replacement

## Summary

Ensure direction-cone visuals belong only to the current graph and are removed when a graph is
replaced or regenerated.

## Acceptance sketch

- Replacing a directed graph with a different graph leaves no arrowhead visuals from the previous
  graph.
- Every visible direction cone corresponds to a directed edge in the current graph.

## Links

- Spec: [SPEC-105](../../specs/105-graph-replacement-arrow-cleanup/spec.md)
- Related items: none
