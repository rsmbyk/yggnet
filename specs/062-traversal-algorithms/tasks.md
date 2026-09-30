# Tasks 062: Traversal and search algorithms

- **Status:** Accepted
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first -> implement -> green. Check off in order. -->

## Checklist

- [x] **T0 — Owner acceptance gate**
  - Acceptance: project owner explicitly Accepts this Draft pack
  - Verify: `plan.md`, `spec.md`, and `tasks.md` all say Accepted before product-code work
  - Files: `specs/062-traversal-algorithms/{plan,spec,tasks}.md`; `backlog/items/ITEM-070.md`; `backlog/board.md`

- [x] **T1 — Generic result reveal timeline**
  - Red: contract/policy tests cover structured-clone-safe phases, concurrent actions, reset, revisit, final emphasis, completed-frame determinism, idle replay, and reduced motion
  - Green: add the minimal generic result-reveal contracts and shared renderer/session interpretation without algorithm-specific branches
  - Verify: targeted graph/session/world tests and `npm run check`
  - Files: focused modules/tests under `src/lib/graph/analysis/**`, `src/lib/session/**`, and `src/lib/world/**`; minimal Result/world integration

- [x] **T2 — Mode-capable BFS, DFS, and Depth-Limited DFS**
  - Red: exact-order tests cover Traverse/Search, conditional Target validation, directed/cyclic/disconnected graphs, DFS non-shortest semantics, depth 0, cutoffs, unreachable targets, artifacts, metrics, Trace, and reveal footprints
  - Green: extend BFS and add DFS/DLS definitions using shared traversal seams
  - Verify: targeted algorithm/registry tests with structured-clone round trips
  - Files: focused analysis definition/algorithm/test modules and graph exports

- [x] **T3 — Concurrent Multi-source and Bidirectional BFS**
  - Red: tests cover ordered Starts, deduplication, shared forest, closest-source path, source-order ties, Start/Target equality, incoming target-side directed traversal, shortest paths, no result, simultaneous waves, and dual inspectors
  - Green: add both definitions and generic concurrent reveal steps
  - Verify: targeted domain/reveal tests
  - Files: focused analysis definition/algorithm/test modules

- [x] **T4 — Iterative Deepening DFS**
  - Red: tests cover limits from 0, search success depth, exhaustion without Max depth, cyclic graphs, per-iteration stack/visited reset, immutable final metrics, reveal phase resets, final footprint, path emphasis, and Trace retention
  - Green: add IDDFS definition and phase-based result reveal
  - Verify: targeted domain/session/world tests
  - Files: focused analysis definition/algorithm/test modules and generic reveal integration

- [x] **T5 — Seeded Random Walk**
  - Red: tests cover optional/generated seed, unsigned integer validation, default/range Max steps, reproducibility, outgoing directions, dead ends, target success/failure, revisits, metrics, transient revisit action, edge replay, and badge absence
  - Green: add seeded PRNG-backed Random Walk definition and generic revisit rendering
  - Verify: targeted domain/world tests with repeated identical runs
  - Files: focused analysis definition/algorithm/test modules and shared reveal renderer policy

- [x] **T6 — Generated form and Result/Trace integration**
  - Red: UI tests cover Mode-dependent fields, ordered node-set selection, normal optional Seed field, no advanced section, final-only IDDFS metrics, footprints, legends, inspectors, and accessible reduced-motion equivalents
  - Green: render the new definitions and generic reveal meanings through existing Analyze surfaces
  - Verify: component/session tests, `npm run check`, and rendered inspection
  - Files: `src/lib/ui/ManagerPanel.svelte`, `src/lib/ui/AnalysisResultPanel.svelte`, focused UI policy/tests, and minimal app orchestration

- [x] **T7 — Playwright acceptance flows**
  - Red: E2E covers representative DFS Traverse/Search, Multi-source concurrent reveal, DLS cutoff, repeated IDDFS reveal with immutable final depth, Bidirectional concurrent reveal, and reproducible Random Walk revisit without badges
  - Green: every visible acceptance scenario passes in the unified Analyze flow
  - Verify: focused `npm run test:e2e -- e2e/analyze-laboratory.e2e.ts`, then full `npm run test:e2e`
  - Files: `e2e/analyze-laboratory.e2e.ts` and focused fixtures/helpers if needed

- [ ] **T8 — Quality and delivery records**
  - Verify: `npm run check`
  - Verify: `npm run lint`
  - Verify: `npm run test:coverage` with `src/lib/graph/**` at least 90%
  - Verify: `npm run test:e2e`
  - Verify: `npm run build`
  - Acceptance: fill final Traceability; update ITEM/board/tasks; bump `VERSION` and `package.json` to `0.40.0`; add changelog section; open draft PR to `develop`
  - Files: spec pack, ITEM/board, version/changelog, and PR metadata

## Done when

- [x] Every acceptance scenario in `spec.md` holds
- [x] All definitions use generic Analyze form/result/trace/reveal contracts
- [x] Search reveals retain traversed footprints and emphasize valid paths without changing final metrics
- [x] Concurrent waves, IDDFS restarts, and Random Walk revisits remain clear with and without motion
- [x] No product implementation began before explicit owner acceptance
- [ ] Full verification is green and delivery records are complete in the same PR
