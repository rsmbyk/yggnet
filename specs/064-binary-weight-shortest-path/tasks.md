# Tasks 064: Binary-weight shortest path

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

## Checklist

- [x] **T0 — Owner acceptance gate**: project owner explicitly accepted this pack before product code.
- [x] **T1 — Eligibility and deque domain tests**: red tests for exact 0/1 validation, deterministic relaxations, directed paths, ties, zero edges, disconnected and same-node cases; implement minimally.
- [x] **T2 — Analyze integration**: generated Start/Target fields, Result metrics/artifacts, serializable deque/distance/predecessor inspectors, and shared reveal policy.
- [x] **T3 — Visible acceptance**: Playwright valid and ineligible flows; `npm run check`, `npm run lint`, `npm run test:coverage`, `npm run test:e2e -- --workers=1`, and `npm run build`.
- [x] **T4 — Delivery**: include ITEM/board and release records in shared Draft PR #38 as directed by the project owner.
