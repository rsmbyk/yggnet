---
id: ITEM-101
status: done
title: 'Louvain community detection'
type: feat
priority: P1
effort: L
created: 2026-10-02
updated: 2026-10-02
spec: 093-louvain-community-detection
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-101: Louvain community detection

## Summary

Partition an undirected weighted graph into communities by modularity optimization.

## Acceptance sketch

- Return a deterministic community partition and modularity score.
- Treat edge weights as nonnegative strengths and explain that interpretation.
- Reveal the final communities with stable component colors and text membership.

## Links

- Spec: [SPEC-093](../../specs/093-louvain-community-detection/spec.md)
