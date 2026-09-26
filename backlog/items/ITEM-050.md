---
id: ITEM-050
status: in_review
title: 'Tags tool interaction and polish'
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

# ITEM-050: Tags tool interaction and polish

## Summary

Polish related Tags-tool interactions: explain valid tag syntax, tighten rename-helper spacing, expand tag-card activation, identify the edited tag in its panel header, and move the styled search input into the Tags header.

## Notes

- Preserve tag charset, validation, rename, focus, delete, and filtering behavior.
- Keep row action controls independent and keyboard accessible.
- ITEM-051–053 are consolidated into this spec.

## Acceptance sketch

- Rename helper explains the allowed charset and sits close to the input.
- Clicking the non-action card area opens the tag editor.
- The editor header shows the tag's current label.
- Tags search appears as a properly styled input in the header.
- Existing actions and data behavior remain unchanged.

## Links

- Spec: [050-tags-tool-interaction-and-polish](../../specs/050-tag-rename-helper-guidance/spec.md)
- Related: ITEM-047, ITEM-051, ITEM-052, ITEM-053
