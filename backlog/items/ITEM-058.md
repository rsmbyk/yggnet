---
id: ITEM-058
status: done
title: 'Illustrated empty states for Nodes/Edges/Tags/Groups'
type: feat
priority: P3
effort: M
created: 2026-09-26
updated: 2026-09-26
spec: specs/053-illustrated-empty-states
branch: feat/053-illustrated-empty-states
pr: 28
archived_at:
archive_reason:
bump: minor
release_version: 0.35.0
---

# ITEM-058: Illustrated empty states for Nodes/Edges/Tags/Groups

## Summary

Add illustrated empty views (icon + title + hint, not text-only) for the Nodes, Edges, Tags, and Groups tools, covering both truly-empty and filter-no-match states.

## Notes

- Now: Nodes/Edges render an empty `<ul>` with nothing; Tags has text-only `No tags yet / No tags match`; Groups has text-only `No groups yet` (`ManagerPanel.svelte`).
- Owner confirmed Groups is in v1 (not deferred).
- Reuse the existing toolbar/manager line-icon style; no new image assets.
- Keep existing copy distinctions (e.g. Tags `No tags yet` vs `No tags match`); add icon + hint alongside.

## Acceptance sketch

- Each of Nodes / Edges / Tags / Groups shows an icon + title + hint when empty.
- Filter-no-match states show a distinct hint from truly-empty states.
- Existing list, filter, and focus behaviors unchanged.

## Links

- Spec: [053-illustrated-empty-states](../../specs/053-illustrated-empty-states/spec.md)
- Related items: ITEM-046, ITEM-047
