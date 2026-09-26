---
id: ITEM-055
status: in_progress
title: 'Fix Tags row overlap'
type: fix
priority: P1
effort: S
created: 2026-09-26
updated: 2026-09-26
spec: specs/051-manager-layout-polish
branch: fix/051-manager-layout-polish

pr:
archived_at:
archive_reason:
bump: patch
release_version: 0.33.1
---

# ITEM-055: Fix Tags row overlap

## Summary

Fix the Tags row layout where the tag label + `N Nodes · M Edges` meta overlaps the Show-only / focus-toggle / delete action buttons, a regression from the ITEM-051 click-target change.

## Notes

- Root cause: `.tags-tool-row-main` is `position: absolute; inset: 0` (`ManagerPanel.svelte`), so it takes no flow space and `.tags-tool-actions` starts at the top of the card under the label/meta.
- Observed via in-app annotation: `button.tags-tool-row-main[data-testid="tags-row-open-1"]` covers the whole card and its text overlaps the action grid.
- Preserve ITEM-051 behavior: full non-action area opens the editor, row actions stay independent, keyboard access keeps a visible focus indicator.

## Acceptance sketch

- Label and counts reserve their own space; action buttons sit below with no visual overlap.
- Clicking non-action card area opens the tag editor; Show-only / focus toggle / delete do not open it as a side effect.
- Keyboard focus indicator remains visible.

## Links

- Spec: [051-manager-layout-polish](../../specs/051-manager-layout-polish/spec.md)
- Related items: ITEM-054, ITEM-051, ITEM-047
