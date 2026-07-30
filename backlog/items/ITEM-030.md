---
id: ITEM-030
status: speccing
title: "Multi-node groups from UI"
type: feat
priority: P1
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-030
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-030: Multi-node groups from UI

## Summary

Create, collapse, and expand district groups from a multi-node selection so groups are usable from the UI, not only via one-node API calls.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Collapse/proxy exist, but UI cannot select 2+ nodes to group. Depends on ITEM-029. Related: ITEM-016 / SPEC-016.

## Acceptance sketch

- With 2+ nodes selected, user can create a group (district container)
- Collapse and expand the group from manager and/or world
- Collapsed group shows a proxy in the world; expand restores member nodes
- Ungroup or dissolve is available without corrupting the document
- Groups persist across save/load and undo/redo

## Links

- Spec: [SPEC-030](../../docs/specs/SPEC-030/spec.md)
- Related items: ITEM-016, ITEM-029
- Prior SPEC: [SPEC-016](../../docs/specs/SPEC-016/spec.md)
