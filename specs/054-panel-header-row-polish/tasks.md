# Tasks 054: Panel header row polish

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`fix/054-panel-header-row-polish`)
- [x] Red — domain/app tests (paths): N/A presentation-only
- [x] Green — implementation (paths): `src/lib/ui/ManagerPanel.svelte`
- [x] Red — E2E: `e2e/tags-tool.e2e.ts` SPEC-054 (gap 6.39 > 5 before the fix)
- [x] Green — E2E (5/5 tags-tool pass, incl. updated SPEC-051 assertions)
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEMs and spec header (patch)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR** (0.35.1)
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
