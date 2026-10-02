---
id: ITEM-052
status: done
title: 'Show tag label in editor header'
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

# ITEM-052: Show tag label in editor header

## Summary

Replace the generic “Tag” header in the tag rename panel with the tag's current label, so the editor is clearly identified.

## Notes

- Keep the header on the original label until a rename is saved.
- Do not change rename validation or helper behavior.

## Acceptance sketch

- Opening a tag editor shows that tag's current label in the panel header.
- Editing the draft does not change the header before save.
- A saved rename appears in the header when reopened.

## Links

- Spec: [050-tag-rename-helper-guidance](../../specs/050-tag-rename-helper-guidance/spec.md)
- Related: ITEM-047, ITEM-050
