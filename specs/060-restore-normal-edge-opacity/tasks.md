# Tasks 060: Restore normal edge opacity

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`fix/060-restore-normal-edge-opacity`)
- [x] Red — renderer partition test under `src/lib/world/` proves normal/focused/cleared bucket behavior
- [x] Green — pure edge-partition helper and `src/lib/world/GraphScene.svelte` use `dimOthers` to select buckets
- [x] Red — E2E: N/A; existing Tags overlay-state coverage is the stable public seam and pixel assertions are out of scope
- [x] Green — `e2e/tags-tool.e2e.ts` and full Playwright suite
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEM and spec header (patch)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR**
- [ ] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [ ] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [x] All acceptance scenarios in spec.md hold
- [x] Tests named above are green
- [ ] Board, tasks, and version are complete in this PR
