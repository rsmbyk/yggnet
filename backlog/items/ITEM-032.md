---
id: ITEM-032
status: done
title: "Node drag / position edit"
type: feat
priority: P1
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-032
branch: feat/SPEC-032-node-drag-position
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-032: Node drag / position edit

## Summary

Let users place nodes deliberately by dragging in the world and/or editing position in the manager; positions persist and are undoable.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Nodes are spiral-auto-placed on add with no drag or position editor. Related: ITEM-004 / SPEC-004, ITEM-015 / SPEC-015 (pin needs movable layout). Live floating motion stays parked.

## Acceptance sketch

- User can drag a node in the world to a new position
- And/or edit x/y/z (or equivalent) in the manager for the selected node
- Position writes into the GraphDocument and survive save/load
- Position changes are undoable/redoable via the command stack
- Drag does not break selection sync or camera controls unexpectedly

## Links

- Spec: [SPEC-032](../../docs/specs/SPEC-032/spec.md)
- Related items: ITEM-004, ITEM-015, ITEM-033
- Prior SPEC: [SPEC-004](../../docs/specs/SPEC-004/spec.md)
