---
id: ITEM-049
status: in_review
title: 'Clear node selection when leaving Nodes tool'
type: feat
priority: P2
effort: S
created: 2026-09-25
updated: 2026-09-26
spec: specs/049-clear-node-selection-on-tool-change
branch: feat/049-clear-node-selection-on-tool-change
pr: 24
archived_at:
archive_reason:
bump: minor
release_version: 0.31.0
---

# ITEM-049: Clear node selection when leaving Nodes tool

## Summary

Clear selected nodes when the Nodes panel closes or the user switches from Nodes to another tool, so selection does not persist after leaving the Nodes workflow.

## Notes

- Closing Nodes already clears all selection; retain that behavior.
- Switching away from Nodes clears node selection and exits sticky multi-select mode.
- Switching between other tools does not clear node selection.

## Acceptance sketch

- Closing Nodes clears selected nodes.
- Switching from Nodes to another tool clears selected nodes.
- Unrelated tool switches do not clear selection.

## Links

- Spec: [049-clear-node-selection-on-tool-change](../../specs/049-clear-node-selection-on-tool-change/spec.md)
- Related: ITEM-042, ITEM-045
