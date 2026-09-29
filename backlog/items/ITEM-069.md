---
id: ITEM-069
status: in_review
title: 'Unified Analyze algorithm laboratory'
type: feat
priority: P0
effort: L
created: 2026-09-29
updated: 2026-09-30
spec: specs/061-unified-analyze
branch: feat/061-unified-analyze
pr: 37
archived_at:
archive_reason:
bump: minor
release_version: 0.39.0
---

# ITEM-069: Unified Analyze algorithm laboratory

## Summary

Replace the separate Pathfinder and path-specific Analyze flows with one extensible Analyze laboratory. Ship BFS traversal and Dijkstra shortest path on generic input, result-artifact, semantic-trace, inspector, playback, and world-decoration contracts.

## Notes

- Travel, A*, path enumeration, stored runs, comparison, and step annotations leave the product in this slice.
- The current analysis is session-only, replaces the prior run, and clears on analysis-relevant structural edits.
- Result and trace visuals use temporary hybrid glyphs around unchanged spherical nodes.
- Future algorithms should normally plug into the definition and artifact contracts without adding algorithm-specific panels or world code.
- Owner review refined the panel to the shared app chrome, added a real bounded/idle-repeating result reveal, made framing panel-aware, and simplified Trace to fixed 2x media controls with collapsed inspector cards.
- The second owner review made idle replay activity-aware and reveal-only, interleaved BFS tree edges with discovered nodes, and refined inspector empty states, hover, motion, and overflow.

## Acceptance sketch

- Analyze is the only algorithm/path tool and renders its inputs from algorithm metadata.
- BFS traverses from one start node; Dijkstra reports one shortest path, edge count, and total weight.
- Result reveal and semantic playback are distinct, reversible views of one current analysis.
- The blocking Result/Trace panel permits camera control but no graph interaction or editing.
- Analysis glyphs never mutate graph data and disappear when the Result/Trace panel closes.

## Links

- Spec: [061-unified-analyze](../../specs/061-unified-analyze/spec.md)
- Related items: ITEM-006, ITEM-007, ITEM-008, ITEM-009, ITEM-010, ITEM-011, ITEM-012, ITEM-013, ITEM-014, ITEM-034, ITEM-035, ITEM-036
