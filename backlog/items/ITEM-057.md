---
id: ITEM-057
status: done
title: 'Fixed Nodes/Edges header row height'
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

# ITEM-057: Fixed Nodes/Edges header row height

## Summary

Give `.manager__header-row` a fixed `min-height` matching the `Add node` button height so the Nodes and Edges `Filter…` dropdowns align, with equal top/bottom padding whether the header button exists or not.

## Notes

- Observed: Nodes panel 115px tall (title + `Add node`) vs Edges 105px (title only); the `Filter…` field sits ~10px lower in Nodes.
- Touchpoint: `.manager__header-row` (`ManagerPanel.svelte`); `.list-search` margin-top stays as-is.
- No behavior change; header buttons and filter interactions unchanged.

## Acceptance sketch

- Nodes and Edges header rows measure equal height.
- `Filter…` dropdowns align vertically between the two tools.
- No change to Add node or filter behavior.

## Links

- Spec: [051-manager-layout-polish](../../specs/051-manager-layout-polish/spec.md)
- Related items: ITEM-054, ITEM-055, ITEM-046
