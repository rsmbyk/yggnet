---
id: ITEM-053
status: in_review
title: 'Move Tags search into header'
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

# ITEM-053: Move Tags search into header

## Summary

Move the Tags tool search input into the header and style it as a proper field, keeping tag filtering and existing header controls functional.

## Notes

- Keep the Tags title and clear-focus action available.
- Render one accessible search input; preserve existing filtering behavior.

## Acceptance sketch

- Tags search appears in the header, not the panel body.
- The input has standard field styling and visible focus treatment.
- Search and clear-focus behavior remain unchanged.

## Links

- Spec: [050-tags-tool-interaction-and-polish](../../specs/050-tag-rename-helper-guidance/spec.md)
- Related: ITEM-047, ITEM-050
