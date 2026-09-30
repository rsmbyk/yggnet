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

- [x] **T0a — Owner acceptance of revised visual contract**
  - Acceptance: project owner explicitly Accepts the revised orange traversal, green path, fixed 180 ms step interval, 300 ms IDDFS hold, endpoint prominence, and real-edge geometry rules
  - Verify: `plan.md`, `spec.md`, and `tasks.md` return to Accepted before revising product code
  - Files: `specs/063-traversal-result-clarity/{plan,spec,tasks}.md`; `backlog/items/ITEM-071.md`; `backlog/board.md`

- [x] **T0b — Owner acceptance of one-object Reveal steps**
  - Acceptance: project owner explicitly Accepts the revision that makes every timed Reveal step
    mark exactly one node or one edge, superseding simultaneous multi-frontier Reveal grouping
  - Verify: `plan.md`, `spec.md`, and `tasks.md` return to Accepted before product-code work
  - Files: `specs/063-traversal-result-clarity/{plan,spec,tasks}.md`

- [x] **T0c — One-object Reveal timeline regression**
  - Red: focused tests reject any timed Reveal step containing more than one visual action and
    cover BFS levels, path replay, Multi-source BFS, Bidirectional BFS, and IDDFS resets
  - Green: split result timelines into deterministic single-node or single-edge steps without
    changing Trace events, inspector operations, the 180 ms interval, or the 300 ms phase hold
  - Verify: focused analysis/world tests and structured-clone round trips
  - Files: `src/lib/graph/analysis/algorithms.ts`, traversal tests, reveal policy tests

- [x] **T0d — Visible one-object pacing acceptance**
  - Acceptance: Playwright observes sequential BFS node/edge Reveal progression and unchanged
    Trace controls
  - Verify: focused Analyze E2E, then the full serial E2E suite
  - Files: `e2e/analyze-laboratory.e2e.ts`

- [x] **T1 — Enum initialization and Random Walk termination**
  - Red: tests cover first-option enum normalization, remembered values, Target visibility, outgoing-reachable coverage, Target-first stopping, unreachable Target completion, dead ends, Max steps, exact step counts, and reproducibility
  - Green: update generic Analyze input normalization and Random Walk stopping/metrics
  - Verify: focused graph/session tests and structured-clone round trips
  - Files: `src/lib/graph/analysis/contracts.ts`, focused algorithm modules/tests, `src/lib/session/**`

- [x] **T2 — Scheduled reveal roles and IDDFS phase holds**
  - Red: policy tests cover retained orange traversal, ordered green path replay, no-result absence of path replay, a fixed 180 ms step interval, 300 ms inter-phase holds, no leading/trailing hold, completed frames, and reduced motion
  - Green: add generic reveal scheduling/role transitions without algorithm-specific renderer branches
  - Verify: focused analysis/world tests
  - Files: `src/lib/graph/analysis/**`, `src/lib/world/analysis-decoration.ts`, `src/lib/world/analysis-decoration.test.ts`

- [x] **T3 — Endpoint, edge-overlay, and no-result presentation**
  - Red: UI/world tests cover endpoint scale/solid contrast, combined endpoint, accessible no-result surface, stored edge endpoints, discovery-edge retention, common orange edge palette, and node-only frontier-side distinction
  - Green: refine shared Result/world presentation and remove purple/green frontier edge roles
  - Verify: `npm run check`, focused component/world tests, and rendered inspection
  - Files: `src/lib/ui/AnalysisResultPanel.svelte`, `src/lib/ui/ManagerPanel.svelte`, `src/lib/world/GraphScene.svelte`, focused policy/tests

- [x] **T4 — Playwright acceptance flows**
  - Red: E2E covers visible Traverse default, orange Traverse result, green Search path replay, prominent endpoints/no result, common reveal interval, shorter IDDFS phase pause, Random Walk early stop/actual steps, and Multi-source/Bidirectional real-edge clarity
  - Green: all visible scenarios pass in the unified Analyze flow
  - Verify: `npm run test:e2e -- e2e/analyze-laboratory.e2e.ts --workers=1`, then full serial E2E
  - Files: `e2e/analyze-laboratory.e2e.ts`

- [x] **T5 — Quality and delivery records**
  - Verify: `npm run check`; `npm run lint`; `npm run test:coverage`; `npm run test:e2e -- --workers=1`; `npm run build`
  - Acceptance: fill final Traceability; update ITEM/board/tasks and PR #38 metadata; record ITEM-071 under shared release `0.40.0`
  - Files: spec pack, ITEM/board, changelog if wording changes, and PR metadata

## Done when

- [x] Every acceptance scenario in `spec.md` holds
- [x] Search traversal remains orange before an ordered green final-path replay
- [x] Endpoints and no-result outcomes are unmistakable without color-only meaning
- [x] IDDFS phase boundaries are readable with and without motion
- [x] Random Walk terminates early and reports exact traversed steps
- [x] Multi-frontier overlays never resemble fabricated edges
- [x] No product implementation began before explicit owner acceptance
- [x] Full verification and delivery records are complete in PR #38
