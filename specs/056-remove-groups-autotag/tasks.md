# Tasks 056: Remove Groups, autotag Group-N

- **Status:** Draft
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [ ] Spec Accepted by the project owner
- [ ] Branch from the current base (`feat/056-remove-groups-autotag`)
- [ ] Red — domain/app tests (autotag naming/counter/collision; legacy `groupId` parse)
- [ ] Green — implementation (graph model, session, `ManagerPanel`, world, toolbar)
- [ ] Red — E2E (autotag incl. save/load numbering; Groups UI absence; legacy import)
- [ ] Green — E2E (remove/repurpose `e2e/groups.e2e.ts`, SPEC-053 groups assertions)
- [ ] Fill Traceability in `./spec.md`
- [ ] Mark SPEC-016 Deprecated
- [ ] Set `bump` on the ITEM and spec header (major)
- [ ] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR**
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
