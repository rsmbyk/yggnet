# Tasks 063: Traversal result clarity and pacing

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first -> implement -> green. Check off in order. -->

## Checklist

- [x] **T0 — Owner acceptance gate**
  - Acceptance: project owner explicitly Accepts this Draft pack
  - Verify: `plan.md`, `spec.md`, and `tasks.md` all say Accepted before product-code work
  - Files: `specs/063-traversal-result-clarity/{plan,spec,tasks}.md`; `backlog/items/ITEM-071.md`; `backlog/board.md`

- [ ] **T1 — Enum initialization and Random Walk termination**
  - Red: tests cover first-option enum normalization, remembered values, Target visibility, outgoing-reachable coverage, Target-first stopping, unreachable Target completion, dead ends, Max steps, exact step counts, and reproducibility
  - Green: update generic Analyze input normalization and Random Walk stopping/metrics
  - Verify: focused graph/session tests and structured-clone round trips
  - Files: `src/lib/graph/analysis/contracts.ts`, focused algorithm modules/tests, `src/lib/session/**`

- [ ] **T2 — Scheduled reveal roles and IDDFS phase holds**
  - Red: policy tests cover orange active state, muted-green settlement, ordered gold path replay, no-result absence of path replay, 600 ms inter-phase holds, no leading/trailing hold, completed frames, and reduced motion
  - Green: add generic reveal scheduling/role transitions without algorithm-specific renderer branches
  - Verify: focused analysis/world tests
  - Files: `src/lib/graph/analysis/**`, `src/lib/world/analysis-decoration.ts`, `src/lib/world/analysis-decoration.test.ts`

- [ ] **T3 — Endpoint, edge-overlay, and no-result presentation**
  - Red: UI/world tests cover stronger distinct endpoint glyphs, combined endpoint, accessible no-result surface, real-edge alignment, common edge palette, and node-only frontier-side distinction
  - Green: refine shared Result/world presentation and remove purple/green frontier edge roles
  - Verify: `npm run check`, focused component/world tests, and rendered inspection
  - Files: `src/lib/ui/AnalysisResultPanel.svelte`, `src/lib/ui/ManagerPanel.svelte`, `src/lib/world/GraphScene.svelte`, focused policy/tests

- [ ] **T4 — Playwright acceptance flows**
  - Red: E2E covers visible Traverse default, settled final footprint, Search path replay, prominent no result, IDDFS phase pause, Random Walk early stop/actual steps, and Multi-source/Bidirectional edge clarity
  - Green: all visible scenarios pass in the unified Analyze flow
  - Verify: `npm run test:e2e -- e2e/analyze-laboratory.e2e.ts --workers=1`, then full serial E2E
  - Files: `e2e/analyze-laboratory.e2e.ts`

- [ ] **T5 — Quality and delivery records**
  - Verify: `npm run check`; `npm run lint`; `npm run test:coverage`; `npm run test:e2e -- --workers=1`; `npm run build`
  - Acceptance: fill final Traceability; update ITEM/board/tasks and PR #38 metadata; record ITEM-071 under shared release `0.40.0`
  - Files: spec pack, ITEM/board, changelog if wording changes, and PR metadata

## Done when

- [ ] Every acceptance scenario in `spec.md` holds
- [ ] Search exploration settles before an ordered final-path replay
- [ ] Endpoints and no-result outcomes are unmistakable without color-only meaning
- [ ] IDDFS phase boundaries are readable with and without motion
- [ ] Random Walk terminates early and reports exact traversed steps
- [ ] Multi-frontier overlays never resemble fabricated edges
- [ ] No product implementation began before explicit owner acceptance
- [ ] Full verification and delivery records are complete in PR #38
