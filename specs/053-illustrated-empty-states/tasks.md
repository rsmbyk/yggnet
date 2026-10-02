# Tasks 053: Illustrated empty states

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`feat/053-illustrated-empty-states`)
- [x] Red — domain/app tests: N/A presentation-only (both new E2E failed Red first)
- [x] Green — implementation: `src/lib/ui/ManagerPanel.svelte`
- [x] Red — E2E: `e2e/empty-states.e2e.ts` (2 new tests failed before the fix)
- [x] Green — E2E (2/2 pass; neighbors groups/tags-tool/multi-select/manager-edges/crud pass)
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEM and spec header (minor)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR** (0.35.0)
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
