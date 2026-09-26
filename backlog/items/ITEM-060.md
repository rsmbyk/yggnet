---
id: ITEM-060
status: in_review
title: 'Darken success helper green'
type: fix
priority: P3
effort: S
created: 2026-09-26
updated: 2026-09-26
spec: specs/051-manager-layout-polish
branch: fix/051-manager-layout-polish

pr: 26
archived_at:
archive_reason:
bump: patch
release_version: 0.33.1
---

# ITEM-060: Darken success helper green

## Summary

Darken the tag-rename success helper (`Available`) to a deeper success green, helper-scoped, since the current `#2f9e8a` reads too light.

## Notes

- Not the accent: accent is `#0b6e7a` (`src/app.css`); `#2f9e8a` is the dedicated success color (`ManagerPanel.svelte` `.field-helper.success`).
- `#2f9e8a` is also used for `.ok-tag`, `.series-a`, and the world overlay (`GraphScene.svelte`); this item changes the helper only unless the owner asks for a global success token.
- Keep error color and validation behavior unchanged.

## Acceptance sketch

- `Available` helper renders in the darker success green with adequate contrast on the panel.
- Error helper color unchanged.
- No change to world overlay or series colors.

## Links

- Spec: [051-manager-layout-polish](../../specs/051-manager-layout-polish/spec.md)
- Related items: ITEM-059, ITEM-050
