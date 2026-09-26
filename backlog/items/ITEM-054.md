---
id: ITEM-054
status: in_progress
title: 'Tags search below title'
type: fix
priority: P2
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

# ITEM-054: Tags search below title

## Summary

Move the Tags tool `Search tags…` input out of the header row to a full-width row below the `Tags` title, keeping filtering, accessible naming, focus treatment, and the clear-focus action.

## Notes

- Reverses part of SPEC-050 / ITEM-053, which put search in the header.
- Current header row (`ManagerPanel.svelte` tags-header-controls) holds title + search + reset side by side.
- Keep `data-testid="tags-search"`, `aria-label="Search tags"`, existing filtering and empty/no-match states.

## Acceptance sketch

- Search input renders below the `Tags` title, full width, not beside it.
- Typing filters the tag list; empty states still work.
- Clear-focus button remains available and functional.

## Links

- Spec: [051-manager-layout-polish](../../specs/051-manager-layout-polish/spec.md)
- Related items: ITEM-055, ITEM-057, ITEM-059, ITEM-060, ITEM-053
