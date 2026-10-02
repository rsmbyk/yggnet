---
id: ITEM-086
status: in_review
title: 'Bipartite maximum matching analysis'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 078-hopcroft-karp-matching
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-086: Bipartite maximum matching analysis

## Summary

Add Hopcroft-Karp maximum matching for bipartite graphs.

## Acceptance sketch

- A valid bipartition is derived deterministically before matching.
- Result lists all matching edges and their cardinality.
- Non-bipartite graphs and self-loops return explanatory `No result`.

## Links

- Spec: [SPEC-078](../../specs/078-hopcroft-karp-matching/spec.md)
