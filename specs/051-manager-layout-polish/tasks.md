# Tasks 051: Manager layout polish

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`fix/051-manager-layout-polish`)
- [x] Red — domain/app tests (paths): N/A presentation-only
- [x] Green — implementation (paths): `src/lib/ui/ManagerPanel.svelte`
- [x] Red — E2E: extended `e2e/tags-tool.e2e.ts` (failed on search placement before the fix)
- [x] Green — E2E (4/4 tags-tool tests pass)
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEMs and spec header (patch)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR** (0.33.1)
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
