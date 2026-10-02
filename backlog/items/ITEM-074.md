---
id: ITEM-074
status: done
title: 'Acyclic shortest path'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: specs/066-dag-shortest-path/spec.md
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-074: Acyclic shortest path

## Summary

Add topological-order DAG shortest path to Analyze.

## Notes

- The eligible graph contains directed edges only and no directed cycle.

## Acceptance sketch

- A valid DAG supports negative weights and returns an optimal finite path.

## Links

- Spec: [SPEC-066](../../specs/066-dag-shortest-path/spec.md)
- Related items: ITEM-069
