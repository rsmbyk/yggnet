# Tasks 057: Remove Diff tool

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`feat/057-remove-diff-tool`)
- [x] Red — inventory `diffIds` consumers; domain/app tests for neighboring selection state
- [x] Green — implementation (toolbar, panel, session, world if touched)
- [x] Red — E2E (remove/repurpose diff coverage)
- [x] Green — E2E
- [x] Fill Traceability in `./spec.md`
- [x] Mark SPEC-018 Deprecated
- [x] Set `bump` on the ITEM and spec header (minor)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR**
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [x] All acceptance scenarios in spec.md hold
- [x] Tests named above are green
- [x] Board, tasks, and version (if any) are complete in this PR
