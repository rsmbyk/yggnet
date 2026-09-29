# Tasks 061: Unified Analyze algorithm laboratory

- **Status:** Draft
- **Plan:** [./plan.md](./plan.md)
- **Spec:** [./spec.md](./spec.md)

<!-- Failing test first -> implement -> green. Check off in order. -->

## Checklist

- [x] **T0 — Owner acceptance gate**
  - Acceptance: project owner explicitly Accepts this Draft pack
  - Verify: `plan.md`, `spec.md`, and `tasks.md` all say Accepted before product-code work
  - Files: `specs/061-unified-analyze/{plan,spec,tasks}.md`; `backlog/items/ITEM-069.md`; `backlog/board.md`

- [x] **T1 — Analysis contracts, validation, reducer, checkpoints, and trace budget**
  - Red: contract tests cover field validation, serializable results/events, role precedence, inspector operations, checkpoint seeking, and 50,000-event truncation
  - Green: framework-agnostic `src/lib/graph/analysis/**` contracts and reducer pass
  - Verify: targeted Vitest plus structured-clone round-trip assertions
  - Files: new focused modules/tests under `src/lib/graph/analysis/**`; graph barrel exports

- [x] **T2 — BFS traversal definition**
  - Red: A-H example asserts exact reachable order, BFS tree, semantic action sequence, Queue, and Visited states; add directed/disconnected cases
  - Green: start-only BFS emits the generic result and event contracts
  - Verify: targeted algorithm tests
  - Files: BFS implementation/test plus registry/definition wiring

- [x] **T3 — Dijkstra definition**
  - Red: shortest path, Length, Cost, directed edges, Start=End, unreachable target, negative-weight validation, and inspector/event cases
  - Green: Dijkstra emits generic path result, metrics, trace, and inspectors
  - Verify: targeted algorithm and registry tests
  - Files: Dijkstra implementation/test plus definition wiring

- [x] **T4 — Single current-analysis session lifecycle**
  - Red: tests cover run replacement, open/close/resume, cursor/mode/speed, playback cancellation, relevant structural invalidation, and non-invalidating presentation/position changes
  - Green: replace directions/analyze/run-store coupling with one `CurrentAnalysis`
  - Verify: session tests and `npm run check`
  - Files: focused session state/helper/test modules and app orchestration

- [x] **T5 — Unified Analyze form and blocking Result/Trace panel**
  - Red: tool/panel tests cover one Analyze entry, generated fields, inline validation, Result/Trace switching, inspectors, controls, prior inputs, and blocked app commands
  - Green: remove Pathfinder UI and replace the path-specific Analyze panel
  - Verify: component/session tests and keyboard/accessibility checks
  - Files: tool ids/toolbar, Analyze form, Result/Trace panel, focused styles/tests

- [x] **T6 — Hybrid glyph renderer and bounded reveal**
  - Red: pure world tests cover role priority, decoration lifecycle/sizing, raycast exclusion, directional edge progress, reveal budgeting/batching, and reduced motion
  - Green: render pooled/instanced cages, halos, rings/checks, probes, minimal badges, and edge ribbons above the unchanged base graph
  - Verify: world unit tests, `npm run check`, and manual WebGL inspection
  - Files: focused analysis-decoration/reveal helpers and `GraphScene.svelte` integration

- [x] **T7 — Playwright acceptance flow**
  - Red: new E2E covers BFS, Dijkstra, result reveal, trace controls, camera-only world input, close/resume, structural invalidation, and absence of removed features
  - Green: user-visible acceptance scenarios pass; remove superseded compare/annotation E2E files
  - Verify: `npm run test:e2e -- e2e/analyze-laboratory.e2e.ts` then full `npm run test:e2e`
  - Files: `e2e/analyze-laboratory.e2e.ts`; obsolete analyze/path E2E cleanup

- [x] **T8 — Legacy removal and architecture records**
  - Acceptance: remove Pathfinder/Travel/A*/path enumeration/run history/compare/annotation code, tests, commands, and labels; no orphan imports or state remain
  - Acceptance: add an ADR and update `docs/ARCHITECTURE.md`; mark superseded specs Deprecated with SPEC-061 references
  - Verify: repository-wide `rg` inventory plus check/lint/build/tests
  - Files: legacy graph/session/UI/world modules and relevant docs/spec headers

- [x] **T9 — Quality and release records**
  - Verify: `npm run check`
  - Verify: `npm run lint`
  - Verify: `npm run test:coverage` with `src/lib/graph/**` at least 90%
  - Verify: `npm run test:e2e`
  - Verify: `npm run build`
  - Acceptance: fill spec Traceability with final paths; update ITEM/board/tasks; bump `VERSION` and `package.json` to `0.39.0`; add changelog section; open draft PR to `develop`
  - Files: spec pack, ITEM/board, version/changelog, PR metadata

- [x] **T10 — Owner-review Analyze UI and playback refinement**
  - Red: session/world tests cover fixed 2x cadence controls and zoom-stable glyph sizing; Playwright covers native panel layout, algorithm title, full-width tabs, metric rows, toolbar blocking, inspector accordions, and idle result replay
  - Green: align Result/Trace with app chrome, animate result artifacts, center node rings, fit the camera around the panel, and implement the requested media-player trace flow
  - Verify: targeted Vitest and Playwright, then the full quality gate
  - Files: Analyze session/UI/world modules, `e2e/analyze-laboratory.e2e.ts`, and accepted SPEC-061 pack

- [ ] **T11 — Second owner-review idle, inspector, overflow, and BFS reveal refinement**
  - Red: tests cover activity-aware ten-second idle reset, reveal-only replay without camera framing, absent Skip control, equivalent empty inspector states, stable trace width, and exact A/A-B/B/A-C/C/A-D/D/B-E/E reveal order
  - Green: add centralized Result activity tracking, separate replay from framing, animate accessible inspector accordions with hover feedback, eliminate trace horizontal layout drift, and interleave BFS tree edges with discovered nodes
  - Verify: targeted session/world/UI tests and Playwright, rendered inspection at narrow and desktop widths, then the full quality gate
  - Files: Analyze session/UI/world modules, `e2e/analyze-laboratory.e2e.ts`, and this accepted amendment

## Done when

- [ ] Every acceptance scenario in `spec.md` holds
- [x] Analyze is the only algorithm tool and BFS/Dijkstra use the generic contracts
- [ ] Result and Trace remain synchronized and temporary glyphs have a clean lifecycle
- [x] Removed capabilities leave no active UI, code path, command, or E2E expectation
- [ ] Full verification is green and delivery records are complete in the same PR
