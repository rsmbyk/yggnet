---
id: ITEM-097
status: in_review
title: 'Graph girth'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 089-graph-girth
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-097: Graph girth

## Summary

Find the shortest cycle in an undirected multigraph and report its length.

## Acceptance sketch

- Treat self-loops as length 1 and parallel-edge cycles as length 2.
- Return one deterministic shortest real cycle.
- Explain when no cycle exists or direction is ineligible.

## Links

- Spec: [SPEC-089](../../specs/089-graph-girth/spec.md)
