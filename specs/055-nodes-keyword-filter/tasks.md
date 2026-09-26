# Tasks 055: Nodes keyword filter

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first → implement → green. Check off in order. -->

## Checklist

- [x] Spec Accepted by the project owner
- [x] Branch from the current base (`feat/055-nodes-keyword-filter`)
- [x] Red — domain/app tests: `src/lib/graph/search/nodeListFilter.test.ts` (3 failed on the new signature)
- [x] Green — implementation: `src/lib/graph/search/nodeListFilter.ts`, session filter state, `src/lib/ui/ManagerPanel.svelte`
- [x] Red — E2E (Nodes keyword create/filter/prefill/replace/clear; update SPEC-050 optgroup assertions)
- [x] Green — E2E
- [x] Fill Traceability in `./spec.md`
- [x] Set `bump` on the ITEM and spec header (minor)
- [x] If bump is not `none`: `VERSION`, changelog `## [X.Y.Z]`, and `release_version` in **this PR** (0.36.0)
- [ ] Update ITEM + [`backlog/board.md`](../../backlog/board.md) in **this PR** (In review while open; Done before merge)
- [ ] Conventional Commit + draft PR linking `./spec.md` (same PR; extra commits fine)

## Done when

- [ ] All acceptance scenarios in spec.md hold
- [ ] Tests named above are green
- [ ] Board, tasks, and version (if any) are complete in this PR
