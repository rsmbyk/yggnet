---
id: ITEM-087
status: in_review
title: 'Flow network analysis'
type: feat
priority: P1
effort: L
created: 2026-10-01
updated: 2026-10-02
spec: 079-flow-network-analysis
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-087: Flow network analysis

## Summary

Add deterministic Ford-Fulkerson, Edmonds-Karp, Dinic maximum-flow, and minimum-cut Analyze
definitions for directed non-negative-capacity networks.

## Acceptance sketch

- All maximum-flow definitions return the same maximum value and final real-flow edges.
- Minimum Cut lists both sides, real cut edges, and capacity equal to maximum flow.
- Invalid directions, capacities, empty graphs, and equal endpoints return explanatory `No result`.

## Links

- Spec: [SPEC-079](../../specs/079-flow-network-analysis/spec.md)
