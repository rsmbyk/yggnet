---
id: ITEM-062
status: done
title: 'Full-card Tags row editor target'
type: fix
priority: P2
effort: S
created: 2026-09-26
updated: 2026-09-26
spec: specs/054-panel-header-row-polish
branch: fix/054-panel-header-row-polish
pr: 29
archived_at:
archive_reason:
bump: patch
release_version: 0.35.1
---

# ITEM-062: Full-card Tags row editor target

## Summary

Expand the tag row editor target to the whole card (click + focus ring) while keeping the Show-only / focus / delete buttons in their current position and free of overlap.

## Notes

- Do not restore the absolute overlay (that caused ITEM-055's overlap). Draft approach: grid-stretch — `.tags-tool-row` becomes a grid, `row-main` spans all rows with the label pinned top, actions sit in row 2 above it.
- Keep ITEM-051 behavior: non-action area opens the editor, row actions stay independent, keyboard focus stays visible (now ringing the whole card).
- Existing E2E (card-corner click opens editor, action independence, focus outline) must keep passing, possibly with updated geometry assertions.

## Acceptance sketch

- Clicking anywhere on the card outside the three action buttons opens the tag editor.
- Focus ring outlines the whole card.
- Label/meta and action buttons never visually overlap.
- Activating a row action does not open the editor.

## Links

- Spec: [054-panel-header-row-polish](../../specs/054-panel-header-row-polish/spec.md)
- Related items: ITEM-061, ITEM-055, ITEM-051
