---
id: ITEM-099
status: done
title: 'Degree distribution'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 091-degree-distribution
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-099: Degree distribution

## Summary

Return accessible degree-frequency tables for every node degree in a homogeneous graph.

## Acceptance sketch

- Undirected graphs report one distribution; directed graphs report in, out, and total distributions.
- Count loops and parallel edges using graph-theoretic degree multiplicity.
- Reject mixed direction and ignore weights.

## Links

- Spec: [SPEC-091](../../specs/091-degree-distribution/spec.md)
