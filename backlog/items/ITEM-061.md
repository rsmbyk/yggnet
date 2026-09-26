---
id: ITEM-061
status: in_review
title: 'Tighten header-to-content gap'
type: fix
priority: P3
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

# ITEM-061: Tighten header-to-content gap

## Summary

Reduce the vertical air between the manager header row and the content below it (title/search/filter → list), while keeping the Nodes/Edges header rows equal height per ITEM-057.

## Notes

- Stack-up today (`ManagerPanel.svelte`): `.manager` flex gap `0.85rem`, `.manager__header-row` min-height `2rem`, `.tags-search-row` / `.list-search` margin-top `0.4rem`.
- Scope may be panel-wide (all tools) or Tags-scoped; lock at Draft Accept. Panel-wide is recommended for consistency.
- No behavior change; ITEM-057 alignment must not regress.

## Acceptance sketch

- Measured header-row-bottom → content-top distance is smaller in Tags, Nodes, Edges, and tag-edit (before/after numbers in the spec).
- Nodes vs Edges header/filter alignment still equal.
- No change to filtering, focus, or selection behavior.

## Links

- Spec: [054-panel-header-row-polish](../../specs/054-panel-header-row-polish/spec.md)
- Related items: ITEM-062, ITEM-057, ITEM-054
