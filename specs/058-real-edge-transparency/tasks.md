# Tasks 058: Real edge transparency

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`fix/058-real-edge-transparency`)
- [x] Red — renderer partition cases reviewed; no standalone helper was extracted
- [x] Green — implementation: `src/lib/world/GraphScene.svelte` (two-bucket instancing), drop edge bg-lerp
- [x] Red — E2E (overlay-state coverage)
- [x] Green — E2E
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEM and spec header (patch)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR**
- [x] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [x] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [x] All acceptance scenarios in spec.md hold
- [x] Tests named above are green
- [x] Board, tasks, and version (if any) are complete in this PR
