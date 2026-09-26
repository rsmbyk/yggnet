---
id: ITEM-059
status: done
title: 'Tighten tag rename helper spacing'
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

# ITEM-059: Tighten tag rename helper spacing

## Summary

Pull the tag rename helper (`#tag-edit-helper`) close under the input with a small gap before Save, scoped to the tag-edit section only.

## Notes

- Now: `.selection-sheet-body` has `gap: 0.85rem` plus `.field-helper` margins, so `Tag already exists` / `Available` sits far from both the input and Save.
- Follow-up tightening of SPEC-050, which already scoped helper spacing once.
- Keep helper copy, validation, and Save-disabled behavior unchanged.

## Acceptance sketch

- Helper sits close beneath the input with little trailing space before Save.
- Error / success copy and Save enablement unchanged.
- No spacing change outside the tag-edit section.

## Links

- Spec: [051-manager-layout-polish](../../specs/051-manager-layout-polish/spec.md)
- Related items: ITEM-054, ITEM-055, ITEM-050
