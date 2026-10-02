---
id: ITEM-104
status: in_review
title: 'Chinese Postman analysis'
type: feat
priority: P1
effort: L
created: 2026-10-02
updated: 2026-10-02
spec: 096-chinese-postman
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-104: Chinese Postman analysis

## Summary

Find one minimum-cost closed walk that traverses every stored undirected edge at least once.

## Acceptance sketch

- Support weighted undirected multigraphs with explicit nonnegative-cost rules.
- Preserve every stored edge and use real shortest paths for necessary repeated traversals.
- Explain connectivity and exact odd-vertex matching limits through `No result`.

## Links

- Spec: [SPEC-096](../../specs/096-chinese-postman/spec.md)
