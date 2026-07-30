---
id: ITEM-038
status: archived
title: "Save/load named docs + palette find"
type: feat
priority: P2
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-038
branch: 
pr: 
archived_at: 2026-07-30
archive_reason: released
release_version: 0.30.0
---

# ITEM-038: Save/load named docs + palette find

## Summary

Improve persist UX with named save slots and/or download/open file, and wire the command palette find path to query nodes and jump to them.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Save/load uses a fixed `localStorage` slot; palette has a node list but richer `findNodeByQuery` is unused. Related: ITEM-021 / SPEC-021, ITEM-025 / SPEC-025. Cloud sync stays out of scope.

## Acceptance sketch

- User can save under a name (slot) and/or download GraphDocument JSON as a file
- User can open a named slot and/or pick a local JSON file to load
- Overwrite / replace current document is explicit (confirm or clear affordance)
- Command palette find accepts a query, lists matches, and jumps/selects the chosen node
- Autosave behavior remains available and does not replace explicit named save

## Links

- Spec: [SPEC-038](../../docs/specs/SPEC-038/spec.md)
- Related items: ITEM-021, ITEM-025
- Prior SPECs: [SPEC-021](../../docs/specs/SPEC-021/spec.md), [SPEC-025](../../docs/specs/SPEC-025/spec.md)
