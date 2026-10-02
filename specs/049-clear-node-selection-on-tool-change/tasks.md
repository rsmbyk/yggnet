# SPEC-049 — Tasks

## Tasks

- [x] **T1** — Add session tests for tool-switch selection behavior
  - Red: `src/lib/session/app-tool-selection.test.ts` covers leaving Nodes, preserving non-Nodes transitions, and close behavior
- [x] **T2** — Clear node selection when leaving Nodes
  - Green: `setOpenTool` removes node IDs and exits sticky multi-select on Nodes exit, while preserving edge IDs
- [x] **T3** — Add user-visible tool-switch coverage
  - Playwright: `e2e/multi-select.e2e.ts` covers single/multiple selection clearing on tool switch and close
- [x] **T4** — Verify project checks
  - 344 unit tests, full Playwright suite (after serial verification of two load-related flakes), build, and Svelte/type checks pass

## Done when

- [x] All acceptance scenarios pass
- [x] Existing close-panel selection behavior remains intact
- [x] Board / ITEM status and version records are complete for the PR
