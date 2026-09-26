---
id: SPEC-049
item: ITEM-049
type: feat
feature_area: manager
bump: minor
status: Accepted
title: 'Clear node selection when leaving Nodes tool'
created: 2026-09-25
updated: 2026-09-26
---

# SPEC-049: Clear node selection when leaving Nodes tool

## Problem

Closing the Nodes panel clears selection, but switching directly to another tool leaves selected nodes active.

## Scope

When the user closes the Nodes panel or switches from the Nodes tool to another tool, clear selected node IDs and exit sticky multi-select mode. Closing the Nodes panel retains its existing behavior of clearing all selection. Switching away from Nodes clears node selection only; edge-selection behavior is unchanged. Switching between non-Nodes tools does not clear node selection.

## Acceptance scenarios

### Scenario: Close Nodes panel

- **Given** one or more nodes are selected while the Nodes tool is open
- **When** the user closes the Nodes panel
- **Then** no nodes remain selected and sticky multi-select mode is off

### Scenario: Switch away from Nodes

- **Given** one or more nodes are selected while the Nodes tool is open
- **When** the user switches to another tool
- **Then** no nodes remain selected and sticky multi-select mode is off

### Scenario: Preserve unrelated tool state

- **Given** nodes are selected and a non-Nodes tool is open
- **When** the user switches to another non-Nodes tool
- **Then** the node selection is not cleared by that tool switch

## Non-goals

- Changing selection behavior for world clicks or modifier keys
- Clearing node selection on every tool switch
- Changing graph document data

## Test strategy

- Session tests for `setOpenTool` / `toggleTool` selection side effects
- Playwright: extend `e2e/multi-select.e2e.ts` or add a focused toolbar tool-switch test
