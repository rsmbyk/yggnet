---
id: ITEM-001
status: archived
title: "Manager graph CRUD"
type: feat
priority: P0
effort: L
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-001
branch: 
pr: 
archived_at: 2026-07-30
archive_reason: released
release_version: 0.21.1
---

# ITEM-001: Manager graph CRUD

## Summary

Add/edit/remove nodes and edges in the manager; disconnected graphs are valid.

## Notes

Dual UI outer controller. World stays present while structure is edited here. Related: ITEM-002, ITEM-004, ITEM-005, ITEM-024.

## Acceptance sketch

- Create, edit, and delete nodes from the manager
- Create, edit, and delete edges between existing nodes
- Disconnected components remain one GraphDocument
- Edits update the shared document used by the world

## Links

- Spec: [SPEC-001](../../docs/specs/SPEC-001/spec.md)
- Related items: ITEM-002, ITEM-004, ITEM-005, ITEM-024.
