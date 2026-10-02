# Tasks 105: Graph replacement arrow cleanup

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

## Checklist

- [x] **T0 — Owner acceptance gate**: accepted by the project owner on 2026-10-02.
- [x] **T1 — Red: renderer regression**: reproduce stale direction cones after graph replacement.
- [x] **T2 — Green: renderer lifecycle**: synchronize arrowhead visuals with the current graph edge set.
- [x] **T3 — Red/Green: E2E**: replace a directed graph with another directed graph, then an undirected graph.
- [x] **T4 — Quality**: `npm run check`, `npm run lint`, serial Generate Playwright, and `npm run build` pass.
- [x] **T5 — Delivery**: include ITEM/board and release records in shared Draft PR #38 as directed by the project owner.

## Done when

- [x] All SPEC-105 acceptance scenarios pass.
- [x] Named tests and repository quality gates are green.
- [x] ITEM, board, tasks, and version metadata are complete in the same PR.
