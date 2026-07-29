---
id: ITEM-005
status: backlog
title: "Selection sync"
type: feat
priority: P0
effort: M
created: 2026-07-30
updated: 2026-07-30
spec:
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-005: Selection sync

## Summary

Manager and world share selection through the graph selection API.

## Notes

Domain logic under src/lib/graph; UI only calls it. Related: ITEM-001, ITEM-004, ITEM-025.

## Acceptance sketch

- Selecting in manager highlights in world
- Selecting in world updates manager
- Clear selection works in both surfaces

## Links

- Spec:
- Related items: ITEM-001, ITEM-004, ITEM-025.
