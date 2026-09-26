# Tasks 052: Clear edge selection on tool change

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`feat/052-clear-edge-selection-on-tool-change`)
- [x] Red — domain/app tests: `src/lib/session/app-tool-selection.test.ts` (2 new tests failed before the fix)
- [x] Green — implementation: `src/lib/session/app.svelte.ts` (`setOpenTool` leavingEdges branch)
- [x] Red — E2E: `e2e/multi-select.e2e.ts` SPEC-052 (verified failing with the fix stashed)
- [x] Green — E2E (3/3 multi-select tests pass)
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEM and spec header (minor)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR** (0.34.0)
- [ ] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [ ] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
