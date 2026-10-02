---
id: ITEM-096
status: in_review
title: 'Graph center'
type: feat
priority: P1
effort: S
created: 2026-10-01
updated: 2026-10-02
spec: 088-graph-center
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-096: Graph center

## Summary

Identify every node whose eccentricity equals the graph radius.

## Acceptance sketch

- Return all center nodes in stored order.
- Require a nonempty connected undirected graph.
- Use persistent green result rings with an accessible membership list.

## Links

- Spec: [SPEC-088](../../specs/088-graph-center/spec.md)
