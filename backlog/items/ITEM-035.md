---
id: ITEM-035
status: speccing
title: "Compare stored runs dual view"
type: feat
priority: P2
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-035
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-035: Compare stored runs dual view

## Summary

Pick two stored algorithm runs and view them as a dual overlay or side-by-side comparison, not a single merged overlay.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. `setCompareRunIds` / compare kind exist but UI is shallow. Related: ITEM-013 / SPEC-013, ITEM-034.

## Acceptance sketch

- User can select two stored runs from Analyze history
- World/manager show a dual overlay or side-by-side result for those runs
- Each run remains visually distinguishable
- Stale runs are clearly marked and do not silently look current
- Clearing compare restores the previous single-run view

## Links

- Spec: [SPEC-035](../../docs/specs/SPEC-035/spec.md)
- Related items: ITEM-013, ITEM-034
- Prior SPEC: [SPEC-013](../../docs/specs/SPEC-013/spec.md)
