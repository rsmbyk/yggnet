---
id: ITEM-064
status: done
title: 'Remove Groups; Group button auto-tags Group-N'
type: feat
priority: P1
effort: L
created: 2026-09-26
updated: 2026-09-26
spec: specs/056-remove-groups-autotag
branch: feat/056-remove-groups-autotag
pr: 31
archived_at:
archive_reason:
bump: major
release_version: 0.37.0
---

# ITEM-064: Remove Groups; Group button auto-tags Group-N

## Summary

Remove the Groups concept entirely (toolbar tool, panel section, `groupId` model field, collapse/expand/ungroup, Groups empty view). Only Tags remain. The Nodes multi-select Group button stays in place and tags the selected nodes `Group-N`, with N from a persistent monotonic counter on the document.

## Notes

- Owner decisions: no structural groups of any kind; tag format `Group-N` (hyphen, fitting the tag charset); counter tracks button creations and never reuses numbers; tag rename/delete behave like any tag with no structural side effects.
- Counter rule: N = ++counter; while a `Group-N` tag already exists (e.g. hand-made), keep incrementing. First ever = `Group-1`. Counter lives on the document so it survives save/load and participates in undo history like other doc mutations.
- Removal scope: `TOOL_IDS`/`TOOLS`, Toolbar `iconPath`, ManagerPanel groups section, session group actions + `groupsCollapsed` state, world collapse rendering, `groupId` in the graph model, groups E2E, SPEC-016 (groups-containers) marked Deprecated. Old docs carrying `groupId` must import cleanly (field ignored/dropped).
- Tags apply to the selected nodes only, never edges. Group button stays available only in the Nodes tool.
- Bump is `major`: tool + data-model removal is breaking.

## Acceptance sketch

- No Groups tool, section, or collapse/ungroup UI anywhere.
- Group button tags selected nodes `Group-N` with monotonic numbering across save/load and undo.
- Colliding hand-made `Group-N` names are skipped, never merged into.
- Old documents with `groupId` import without error.
- Tags tool shows `Group-N` with correct counts; rename/delete are plain tag ops.

## Links

- Spec: [056-remove-groups-autotag](../../specs/056-remove-groups-autotag/spec.md)
- Related items: ITEM-058, ITEM-047
