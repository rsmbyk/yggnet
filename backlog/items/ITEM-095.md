---
id: ITEM-095
status: in_review
title: 'Graph radius'
type: feat
priority: P1
effort: S
created: 2026-10-01
updated: 2026-10-02
spec: 087-graph-radius
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-095: Graph radius

## Summary

Return the minimum node eccentricity of a connected undirected graph.

## Acceptance sketch

- Compute an exact unweighted radius.
- Reject empty, directed, mixed, or disconnected graphs.
- Present the scalar without inventing a graph footprint.

## Links

- Spec: [SPEC-087](../../specs/087-graph-radius/spec.md)
