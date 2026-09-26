# SPEC-049 — Plan

## Problem

Closing the Nodes panel clears node selection, but switching directly from Nodes to another tool preserves it. This leaves node selections active after leaving the Nodes tool.

## Approach

Keep the existing close behavior. When the open tool changes from Nodes to a different tool, clear selected node IDs and exit sticky multi-select mode. Do not make unrelated tool switches clear selection. Preserve existing edge-selection behavior unless the owner changes the Draft scope.

## Architecture touchpoints

- `src/lib/session/app.svelte.ts` — `setOpenTool`, `toggleTool`, and selection state
- `src/lib/ui/Toolbar.svelte` — tool-switch input path
- `src/lib/ui/tool-ids.ts` — tool toggle decisions
- Session tests for tool and selection behavior
- Playwright coverage for the user-visible tool switch

## TDD / E2E sequence

1. Add session-level tests for switching away from Nodes with one and multiple selected nodes, including multi-select reset.
2. Implement the smallest session-state change to clear node selection on a Nodes-to-other-tool transition.
3. Add/extend Playwright coverage for switching tools and closing the Nodes panel.
4. Run focused tests and repository checks.

## Risks

- Clearing on every tool switch would broaden behavior and interfere with unrelated selections; scope the transition to leaving Nodes.
- Closing the panel already clears all selection; preserve that established behavior.

## Non-goals

- Changing node selection modifiers or world-click selection behavior.
- Clearing node selection when switching between tools that are not Nodes.
- Altering document graph data.
