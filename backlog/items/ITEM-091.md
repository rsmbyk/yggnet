---
id: ITEM-091
status: in_review
title: 'Maximum independent set analysis'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 083-maximum-independent-set
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-091: Maximum independent set analysis

## Summary

Find one exact largest mutually non-adjacent node set in an undirected graph.

## Acceptance sketch

- Return one maximum independent set with stored-node-order tie-breaking.
- A self-loop prevents its node from joining the result.
- Reject directed or mixed graphs and explain the 20-node exact-search limit.

## Links

- Spec: [SPEC-083](../../specs/083-maximum-independent-set/spec.md)
