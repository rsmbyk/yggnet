---
id: ITEM-093
status: in_review
title: 'Node eccentricity'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 085-node-eccentricity
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-093: Node eccentricity

## Summary

Report each node's greatest unweighted shortest-path distance in a connected undirected graph.

## Acceptance sketch

- Return exact hop eccentricities for every node in stable node order.
- Reject empty, directed, mixed, or disconnected graphs with explanatory `No result`.
- Ignore weights and expose exact values accessibly alongside normalized ranking rings.

## Links

- Spec: [SPEC-085](../../specs/085-node-eccentricity/spec.md)
