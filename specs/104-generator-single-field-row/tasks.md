# Tasks 104: Generator single-field row

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

## Checklist

- [x] **T0 — Owner acceptance gate**: accepted by the project owner on 2026-10-02.
- [x] **T1 — Red: UI tests**: unmatched final field spans; explicit pairs remain unchanged.
- [x] **T2 — Green: layout**: implement full-row behavior for unmatched final fields.
- [x] **T3 — Red/Green: E2E**: assert Bipartite and Helix field grouping at desktop and narrow widths.
- [x] **T4 — Quality**: `npm run check`, `npm run lint`, serial Generate/Tags Playwright, and `npm run build` pass.
- [x] **T5 — Delivery**: include ITEM/board and release records in shared Draft PR #38 as directed by the project owner.

## Done when

- [x] All SPEC-104 acceptance scenarios pass.
- [x] Named tests and repository quality gates pass.
- [x] ITEM, board, tasks, and version metadata are complete in the same PR.
