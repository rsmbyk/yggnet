---
id: ITEM-056
status: done
title: 'Clear edge selection when leaving Edges tool'
type: feat
priority: P2
effort: S
created: 2026-09-26
updated: 2026-09-26
spec: specs/052-clear-edge-selection-on-tool-change
branch: feat/052-clear-edge-selection-on-tool-change
pr: 27
archived_at:
archive_reason:
bump: minor
release_version: 0.34.0
---

# ITEM-056: Clear edge selection when leaving Edges tool

## Summary

Clear selected edge IDs when the Edges panel closes or the user switches from Edges to another tool, mirroring ITEM-049 for nodes, so edge selection does not persist after leaving the Edges workflow.

## Notes

- Current `setOpenTool` (`src/lib/session/app.svelte.ts`) handles `leavingNodes` only; `edges → another tool` leaves `edgeIds` active. `id === null` already clears all selection; retain that.
- Mirror of SPEC-049 scope: switching away from Edges clears edge selection only; switching between non-Edges tools does not clear edge selection.
- Decide in Draft whether leaving Edges always exits sticky multi-select mode (mirror of 049) even if node IDs remain.

## Acceptance sketch

- Closing Edges clears selected edges.
- Switching from Edges to another tool clears selected edges.
- Unrelated tool switches do not clear edge selection.

## Links

- Spec: [052-clear-edge-selection-on-tool-change](../../specs/052-clear-edge-selection-on-tool-change/spec.md)
- Related items: ITEM-049, ITEM-042
