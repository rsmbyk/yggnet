---
id: ITEM-100
status: done
title: 'Tree and forest detection'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 092-tree-forest-detection
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-100: Tree and forest detection

## Summary

Classify a nonempty undirected graph as a tree, a disconnected forest, or neither.

## Acceptance sketch

- Treat self-loops and parallel-edge pairs as cycles.
- A single isolated node is a tree; multiple isolated nodes are a forest.
- Return accessible classification and component/cycle evidence without fabricated edges.

## Links

- Spec: [SPEC-092](../../specs/092-tree-forest-detection/spec.md)
