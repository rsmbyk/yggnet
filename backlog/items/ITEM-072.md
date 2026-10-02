---
id: ITEM-072
status: done
title: 'Binary-weight shortest path'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: specs/064-binary-weight-shortest-path/spec.md
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-072: Binary-weight shortest path

## Summary

Add 0–1 BFS to Analyze when every graph edge is already weighted 0 or 1.

## Notes

- Do not reinterpret weight 0 as an absent edge.
- Invalid graphs receive an explanatory no-result state.

## Acceptance sketch

- 0–1 BFS finds an optimal Start-to-Target cost on valid binary-weight graphs.

## Links

- Spec: [SPEC-064](../../specs/064-binary-weight-shortest-path/spec.md)
- Related items: ITEM-069
