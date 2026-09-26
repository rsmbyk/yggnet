---
id: ITEM-048
status: done
title: 'Sort Edges list by endpoints'
type: feat
priority: P2
effort: S
created: 2026-09-25
updated: 2026-09-26
spec: specs/048-sort-edges-list-by-endpoints
branch: feat/048-sort-edges-list-by-endpoints
pr: 23
archived_at:
archive_reason:
bump: minor
release_version: 0.32.0
---

# ITEM-048: Sort Edges list by endpoints

## Summary

Make the Edges tool easier to scan by sorting rows by the current `from` node label and then the `to` node label.

## Notes

- Sort display rows only; preserve endpoint roles and direction.
- Does not apply to incident-edge views or graph rendering.

## Acceptance sketch

- Edge rows sort by `from` label, then `to` label, case-insensitively.
- Filtering continues to return the same matching edges.

## Links

- Spec: [048-sort-edges-list-by-endpoints](../../specs/048-sort-edges-list-by-endpoints/spec.md)
- Related: ITEM-046
