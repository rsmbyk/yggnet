# Plan 052: Clear edge selection on tool change

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-056
- **Bump:** minor

## Why

Closing the Edges panel clears selection, but switching directly from Edges to another tool leaves selected edges active — the mirror of the SPEC-049 Nodes gap.

## Scope / edges

**In:**

- Clear selected edge IDs when leaving the Edges tool for another tool
- Decide + lock whether sticky multi-select always exits on that transition (mirroring 049)

**Out:**

- World-click or modifier selection behavior
- Clearing edge selection on every tool switch
- Graph document data changes

## Approach

Extend the `setOpenTool` transition in `src/lib/session/app.svelte.ts` with a `leavingEdges` branch mirroring `leavingNodes`. Keep `id === null` clear-all behavior. Cover with session tests first, then a toolbar tool-switch Playwright test.

## TDD

- Domain/app tests: `src/lib/session/app-tool-selection.test.ts` (leave-Edges, preserve non-Edges switches, close behavior)
- E2E (tool named after stack exists): toolbar tool-switch coverage for edge selection clearing

## Risks

- Over-clearing on unrelated switches; scope strictly to leaving Edges.
- Sticky multi-select interplay when both node and edge IDs are present; lock the intended rule in the Draft.
