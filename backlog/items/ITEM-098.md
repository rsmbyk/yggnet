---
id: ITEM-098
status: done
title: 'Graph density'
type: feat
priority: P1
effort: S
created: 2026-10-01
updated: 2026-10-02
spec: 090-graph-density
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-098: Graph density

## Summary

Report graph density with explicit directed and undirected simple-adjacency formulas.

## Acceptance sketch

- Support homogeneous directed or undirected graphs and reject mixed direction.
- Exclude loops and collapse parallel edges for the density numerator.
- Return an exact scalar and formula inputs without graph decoration.

## Links

- Spec: [SPEC-090](../../specs/090-graph-density/spec.md)
