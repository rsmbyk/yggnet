---
id: ITEM-073
status: in_review
title: 'Negative-weight shortest path'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: specs/065-negative-weight-shortest-path/spec.md
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-073: Negative-weight shortest path

## Summary

Add Bellman–Ford to Analyze for shortest paths with negative edge weights.

## Notes

- Report a negative cycle only when it can alter the requested Start-to-Target result.

## Acceptance sketch

- Bellman–Ford returns the optimal finite path or explains why no finite result exists.

## Links

- Spec: [SPEC-065](../../specs/065-negative-weight-shortest-path/spec.md)
- Related items: ITEM-069
