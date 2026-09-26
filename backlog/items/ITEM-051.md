---
id: ITEM-051
status: done
title: 'Expand Tags row click target'
type: fix
priority: P2
effort: S
created: 2026-09-25
updated: 2026-09-26
spec: specs/050-tag-rename-helper-guidance
branch: feat/050-tags-tool-polish
pr: 25
archived_at:
archive_reason:
bump: patch
release_version: 0.31.1
---

# ITEM-051: Expand Tags row click target

## Summary

Make the full tag row/card easier to activate by opening its editor when the user clicks anywhere outside the row action controls.

## Notes

- Keep Show only, focus toggle, and delete controls independent.
- Preserve keyboard accessibility and visible focus behavior.

## Acceptance sketch

- Clicking blank/padded card space opens the corresponding tag editor.
- Activating a row action does not also open the editor.

## Links

- Spec: [050-tag-rename-helper-guidance](../../specs/050-tag-rename-helper-guidance/spec.md)
- Related: ITEM-047, ITEM-050
