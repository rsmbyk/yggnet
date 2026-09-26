# Tasks 058: Real edge transparency

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [ ] Spec Accepted by the project owner
- [ ] Branch from the current base (`fix/058-real-edge-transparency`)
- [ ] Red — domain/app tests: partition helper unit tests under `src/lib/world/`
- [ ] Green — implementation: `src/lib/world/GraphScene.svelte` (two-bucket instancing), drop edge bg-lerp
- [ ] Red — E2E (overlay-state coverage)
- [ ] Green — E2E
- [ ] Fill Traceability in `./spec.md`
- [ ] Set `bump` on the ITEM and spec header (patch)
- [ ] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR**
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
