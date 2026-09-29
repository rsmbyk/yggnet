# Tasks 061: Unified Analyze algorithm laboratory

- **Status:** Draft
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first -> implement -> green. Check off in order. -->

## Checklist

- [ ] **T0 — Owner acceptance gate**
  - Acceptance: project owner explicitly Accepts this Draft pack
  - Verify: `plan.md`, `spec.md`, and `tasks.md` all say Accepted before product-code work
  - Files: `specs/061-unified-analyze/{plan,spec,tasks}.md`; `backlog/items/ITEM-069.md`; `backlog/board.md`

- [ ] **T1 — Analysis contracts, validation, reducer, checkpoints, and trace budget**
  - Red: contract tests cover field validation, serializable results/events, role precedence, inspector operations, checkpoint seeking, and 50,000-event truncation
  - Green: framework-agnostic `src/lib/graph/analysis/**` contracts and reducer pass
  - Verify: targeted Vitest plus structured-clone round-trip assertions
  - Files: new focused modules/tests under `src/lib/graph/analysis/**`; graph barrel exports

- [ ] **T2 — BFS traversal definition**
  - Red: A-H example asserts exact reachable order, BFS tree, semantic action sequence, Queue, and Visited states; add directed/disconnected cases
  - Green: start-only BFS emits the generic result and event contracts
  - Verify: targeted algorithm tests
  - Files: BFS implementation/test plus registry/definition wiring

- [ ] **T3 — Dijkstra definition**
  - Red: shortest path, Length, Cost, directed edges, Start=End, unreachable target, negative-weight validation, and inspector/event cases
  - Green: Dijkstra emits generic path result, metrics, trace, and inspectors
  - Verify: targeted algorithm and registry tests
  - Files: Dijkstra implementation/test plus definition wiring

- [ ] **T4 — Single current-analysis session lifecycle**
  - Red: tests cover run replacement, open/close/resume, cursor/mode/speed, playback cancellation, relevant structural invalidation, and non-invalidating presentation/position changes
  - Green: replace directions/analyze/run-store coupling with one `CurrentAnalysis`
  - Verify: session tests and `npm run check`
  - Files: focused session state/helper/test modules and app orchestration

- [ ] **T5 — Unified Analyze form and blocking Result/Trace panel**
  - Red: tool/panel tests cover one Analyze entry, generated fields, inline validation, Result/Trace switching, inspectors, controls, prior inputs, and blocked app commands
  - Green: remove Pathfinder UI and replace the path-specific Analyze panel
  - Verify: component/session tests and keyboard/accessibility checks
  - Files: tool ids/toolbar, Analyze form, Result/Trace panel, focused styles/tests

- [ ] **T6 — Hybrid glyph renderer and bounded reveal**
  - Red: pure world tests cover role priority, decoration lifecycle/sizing, raycast exclusion, directional edge progress, reveal budgeting/batching, and reduced motion
  - Green: render pooled/instanced cages, halos, rings/checks, probes, minimal badges, and edge ribbons above the unchanged base graph
  - Verify: world unit tests, `npm run check`, and manual WebGL inspection
  - Files: focused analysis-decoration/reveal helpers and `GraphScene.svelte` integration

- [ ] **T7 — Playwright acceptance flow**
  - Red: new E2E covers BFS, Dijkstra, result reveal, trace controls, camera-only world input, close/resume, structural invalidation, and absence of removed features
  - Green: user-visible acceptance scenarios pass; remove superseded compare/annotation E2E files
  - Verify: `npm run test:e2e -- e2e/analyze-laboratory.e2e.ts` then full `npm run test:e2e`
  - Files: `e2e/analyze-laboratory.e2e.ts`; obsolete analyze/path E2E cleanup

- [ ] **T8 — Legacy removal and architecture records**
  - Acceptance: remove Pathfinder/Travel/A*/path enumeration/run history/compare/annotation code, tests, commands, and labels; no orphan imports or state remain
  - Acceptance: add an ADR and update `docs/ARCHITECTURE.md`; mark superseded specs Deprecated with SPEC-061 references
  - Verify: repository-wide `rg` inventory plus check/lint/build/tests
  - Files: legacy graph/session/UI/world modules and relevant docs/spec headers

- [ ] **T9 — Quality and release records**
  - Verify: `npm run check`
  - Verify: `npm run lint`
  - Verify: `npm run test:coverage` with `src/lib/graph/**` at least 90%
  - Verify: `npm run test:e2e`
  - Verify: `npm run build`
  - Acceptance: fill spec Traceability with final paths; update ITEM/board/tasks; bump `VERSION` and `package.json` to `0.39.0`; add changelog section; open draft PR to `develop`
  - Files: spec pack, ITEM/board, version/changelog, PR metadata

## Done when

- [ ] Every acceptance scenario in `spec.md` holds
- [ ] Analyze is the only algorithm tool and BFS/Dijkstra use the generic contracts
- [ ] Result and Trace remain synchronized and temporary glyphs have a clean lifecycle
- [ ] Removed capabilities leave no active UI, code path, command, or E2E expectation
- [ ] Full verification is green and delivery records are complete in the same PR
