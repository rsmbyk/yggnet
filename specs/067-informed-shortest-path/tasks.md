# Tasks 067: Informed point-to-point shortest paths

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

## Checklist

- [x] **T0 — Owner acceptance gate**: project owner explicitly accepted this pack before product code.
- [x] **T1 — Shared non-negative and priority domain seams**: red tests for eligible arcs, stable ties, costs, serialization; minimally implement.
- [x] **T2 — A***: failing admissibility/fallback/optimality tests; definition, helper text, scores/frontier/predecessor Trace and Result.
- [x] **T3 — Bidirectional Dijkstra**: failing directed reverse-wave, bound, meeting and reconstruction tests; implement inspectors/artifacts.
- [x] **T4 — Visible acceptance and quality**: Playwright helper, A*, and bidirectional directed flows; check, lint, coverage, serial E2E, build.
- [x] **T5 — Delivery**: include ITEM/board and release records in shared Draft PR #38 as directed by the project owner.
