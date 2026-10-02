---
id: ITEM-089
status: in_review
title: 'Hamiltonian route analysis'
type: feat
priority: P1
effort: L
created: 2026-10-01
updated: 2026-10-02
spec: 081-hamiltonian-route
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-089: Hamiltonian route analysis

## Summary

Add exact deterministic Hamiltonian Path and Circuit analysis with an explicit interactive size limit.

## Acceptance sketch

- Path and Circuit modes visit every node exactly once and use only stored edges.
- Optional Start constrains the route's first node.
- Graphs above 20 nodes explain the exact-search limit through prominent `No result`.

## Links

- Spec: [SPEC-081](../../specs/081-hamiltonian-route/spec.md)
