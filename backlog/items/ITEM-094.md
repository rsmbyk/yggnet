---
id: ITEM-094
status: done
title: 'Graph diameter'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: 086-graph-diameter
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-094: Graph diameter

## Summary

Return the longest finite unweighted shortest-path distance and one deterministic witness path.

## Acceptance sketch

- Require a nonempty connected undirected graph.
- Use stored node/edge order for tied diametral pairs and paths.
- Replay only the real witness path in green.

## Links

- Spec: [SPEC-086](../../specs/086-graph-diameter/spec.md)
