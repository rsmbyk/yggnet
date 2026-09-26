# Tasks 057: Remove Diff tool

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [ ] Spec Accepted by the project owner
- [ ] Branch from the current base (`feat/057-remove-diff-tool`)
- [ ] Red — inventory `diffIds` consumers; domain/app tests for neighboring selection state
- [ ] Green — implementation (toolbar, panel, session, world if touched)
- [ ] Red — E2E (remove/repurpose diff coverage)
- [ ] Green — E2E
- [ ] Fill Traceability in `./spec.md`
- [ ] Mark SPEC-018 Deprecated
- [ ] Set `bump` on the ITEM and spec header (minor)
- [ ] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR**
- [ ] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [ ] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
