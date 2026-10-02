---
id: ITEM-083
status: done
title: 'Betweenness centrality'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 075-betweenness-centrality
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-083: Betweenness centrality

## Summary

Rank nodes by their normalized share of shortest paths passing through them.

## Acceptance sketch

- Respect edge direction, include equal shortest paths, and list exact scores with stable ties.

## Links

- Spec: [SPEC-075](../../specs/075-betweenness-centrality/spec.md)
