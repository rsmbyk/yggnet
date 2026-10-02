# Spec: Clear edge selection when leaving Edges tool

- **ID:** 052
- **Status:** Accepted
- **Item:** ITEM-056
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

Leaving the Edges tool clears edge selection, mirroring the Nodes behavior from SPEC-049.

## Scope

### In scope

- Closing the Edges panel clears selected edge IDs (existing behavior, locked in)
- Switching from Edges to another tool clears selected edge IDs and exits sticky multi-select mode
- Non-Edges tool switches do not clear edge selection

### Out of scope

- Changing selection behavior for world clicks or modifier keys
- Clearing edge selection on every tool switch
- Changing graph document data

## Domain rules

- `setOpenTool(null)` retains clear-all-selection behavior.
- Leaving Edges clears edge selection only; node-selection rules from SPEC-049 are unchanged.
- Unrelated tool transitions preserve selection.

## Acceptance scenarios

### Scenario: Close Edges panel

- **Given** one or more edges are selected while the Edges tool is open
- **When** the user closes the Edges panel
- **Then** no edges remain selected and sticky multi-select mode is off

### Scenario: Switch away from Edges

- **Given** one or more edges are selected while the Edges tool is open
- **When** the user switches to another tool
- **Then** no edges remain selected and sticky multi-select mode is off

### Scenario: Preserve unrelated tool state

- **Given** edges are selected and a non-Edges tool is open
- **When** the user switches to another non-Edges tool
- **Then** the edge selection is not cleared by that tool switch

## Traceability

- Domain/app tests: `src/lib/session/app-tool-selection.test.ts` (leave-Edges clears, toggle path clears, non-Edges switches preserve, close clears)
- E2E: `e2e/multi-select.e2e.ts` (`SPEC-052 switching away from Edges clears edge selection`; verified Red without the fix)
- Implementation: `src/lib/session/app.svelte.ts` (`setOpenTool` leavingEdges branch mirroring leavingNodes)
