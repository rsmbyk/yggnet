---
id: ITEM-034
status: speccing
title: "Compare algorithms dual view"
type: feat
priority: P2
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-034
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-034: Compare algorithms dual view

## Summary

Compare two algorithms on the same A–B (or same action) with a distinguishable dual overlay or side-by-side result, not a single merged soup.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Compare API / merged overlay exist but are not visually dual. Related: ITEM-012 / SPEC-012, ITEM-035.

## Acceptance sketch

- User picks two algorithms and the same A–B (or shared action)
- Results show in a dual overlay or clear side-by-side comparison
- Each algorithm’s path/result is visually distinguishable
- User can dismiss compare and return to a single overlay
- Stale rules still apply if the graph is edited

## Links

- Spec: [SPEC-034](../../docs/specs/SPEC-034/spec.md)
- Related items: ITEM-012, ITEM-035
- Prior SPEC: [SPEC-012](../../docs/specs/SPEC-012/spec.md)
