---
id: ITEM-092
status: in_review
title: 'Minimum vertex cover analysis'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 084-minimum-vertex-cover
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-092: Minimum vertex cover analysis

## Summary

Find one exact smallest node set touching every stored edge in an undirected graph.

## Acceptance sketch

- Return one minimum cover with stored-node-order tie-breaking.
- Self-looped nodes are mandatory; an edgeless nonempty graph returns an empty cover.
- Reject directed or mixed graphs and explain the 20-node exact-search limit.

## Links

- Spec: [SPEC-084](../../specs/084-minimum-vertex-cover/spec.md)
