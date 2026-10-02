---
id: ITEM-090
status: done
title: 'Maximum clique analysis'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 082-maximum-clique
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-090: Maximum clique analysis

## Summary

Find one exact largest pairwise-adjacent node set in an undirected graph.

## Acceptance sketch

- Return one maximum clique with stored-node-order tie-breaking.
- Reject directed or mixed graphs and explain the 20-node exact-search limit.
- Parallel edges collapse to adjacency and self-loops do not create distinct-node adjacency.

## Links

- Spec: [SPEC-082](../../specs/082-maximum-clique/spec.md)
