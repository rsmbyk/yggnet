---
id: ITEM-024
status: archived
title: 'Undo / redo'
type: feat
priority: P0
effort: L
created: 2026-07-30
updated: 2026-07-30
spec: specs/024-undo-redo
branch:
pr:
archived_at: 2026-07-30
archive_reason: released
release_version: 0.21.1
---

# ITEM-024: Undo / redo

## Summary

Command-stack undo and redo for graph edits.

## Notes

Related: ITEM-001, ITEM-011.

## Acceptance sketch

- Undo reverses last graph edit
- Redo reapplies
- Stack clears or adjusts appropriately on load

## Links

- Spec: [024-undo-redo](../../specs/024-undo-redo/spec.md)
- Related items: ITEM-001, ITEM-011.
