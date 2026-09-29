# Plan 061: Unified Analyze algorithm laboratory

- **Status:** Draft
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-069
- **Bump:** minor

## Why

Pathfinder and Analyze duplicate A-to-B state while the algorithm contracts, run store, overlays, and UI assume that every useful result is a path. This prevents Analyze from becoming a general graph-algorithm laboratory and makes the existing trace too coarse to explain an algorithm's decisions.

The replacement must answer two different user needs without conflating them: show the final result quickly, then optionally let the user walk through the semantic actions that produced it.

## Scope / edges

**In:**

- One Analyze toolbar tool with definition-driven input fields
- Generic serializable analysis definitions, results, artifacts, semantic events, frames, roles, inspectors, and runner boundary
- BFS start-only traversal and Dijkstra Start-to-End shortest path
- One session-only current analysis with deterministic backward/forward playback and periodic checkpoints
- Bounded final-result reveal plus Result and Trace views in a blocking right-side panel
- Analysis-only hybrid glyph layer around unchanged spherical nodes
- Analysis-relevant invalidation, trace cap, reduced-motion behavior, and clear error/no-result states
- Removal of Pathfinder, Travel, A*, all/simple shortest path enumeration, stored runs, comparison, and annotations
- ADR/architecture and superseded-spec updates
- Owner-requested UI refinement: native app styling, panel-aware camera fitting, real result animation, compact media controls, and inspector accordions
- Second owner-review refinement: true user-idle replay, reveal-only repeats, animated inspector accordions, stable trace width, and traversal-ordered BFS reveal
- Analyze tool-panel refinement: one header, shared field sizing, searchable node inputs, Generate-style primary action, and contextual Last result access
- Result/Trace refinement: distinct result landmarks, a slightly faster bounded reveal, persistent inspector expansion during playback, and unambiguous media-control states
- Result-landmark refinement: replace literal letter badges with geometric Start/End treatments and keep Stop/Reset available at the final action

**Out:**

- Adding algorithms beyond BFS and Dijkstra
- Travel or any guided camera movement along a result path
- Worker implementation, persistence of analyses, comparison, annotations, or multi-run history
- Per-algorithm custom UI or arbitrary algorithm-owned colors/meshes
- Future artifact visuals such as ranking bars, component hulls, or flow particles

## Approach

1. Define the framework-agnostic analysis contracts first. Algorithms declare fields and emit semantic event deltas; they never import Svelte, Threlte, Three.js, colors, or animation timing.
2. Store one `CurrentAnalysis` in session state. Reduce immutable events into deterministic frames and checkpoint every 100 events for seeking. Retain no more than 50,000 semantic events; truncation affects playback only, never result correctness.
3. Render result artifacts and trace frames through shared presentation adapters. The world maps semantic roles to a pooled, non-interactive hybrid glyph layer and keeps detailed data structures in generic panel inspectors.
4. Replace the two old tools with the generated Analyze form and blocking Result/Trace panel. Remove the coupled legacy state rather than leave dormant code.
5. Preserve the existing worker-ready `AlgorithmRunner` principle and structured-clone-safe graph snapshot boundary.
6. Treat pointer, wheel, click, keyboard, and camera-control activity as user activity. Restart a ten-second Result idle window on any such input; an idle replay restarts only artifact reveal progress and never reframes the camera.
7. Derive BFS result reveal order from the ordered traversal plus accepted tree edges, interleaving each discovery edge before the node it discovered.
8. Derive result-landmark decorations from the selected inputs and final artifacts so important nodes such as Start and End are distinguishable without changing base graph meshes or adding algorithm-owned rendering.
9. Keep inspector expansion as panel UI state independent of trace frames, cursors, and autoplay, and derive transport labels, icons, and disabled states from the current cursor/playing state.
10. Present landmark semantics with renderer-owned geometry and color rather than literal letter badges: Start uses a diamond cage, End uses a target-like double ring, and Start=End uses one combined treatment.

## Interface direction

- `AnalysisDefinition` owns metadata, declarative fields, validation, and execution.
- `AnalysisResult` is an outcome plus summary metrics and reusable `AnalysisArtifact` values.
- `AnalysisEvent` carries structured narration references, role changes, and inspector operations.
- `AnalysisFrame` is the reducer output consumed by UI/world adapters.
- `CurrentAnalysis` owns the latest result, retained trace, playback cursor/mode, checkpoints, truncation flag, and source revision.
- Core roles are `current`, `inspecting`, `frontier`, `settled`, `result`, and `rejected`; future definitions may declare named extension roles but not colors or geometry.

## Delivery order

1. Contracts, validation, reducer, checkpoints, trace budget
2. BFS and Dijkstra migrations with exact semantic traces
3. Single-analysis session lifecycle and structural invalidation
4. Unified Analyze form and Result/Trace panel
5. Hybrid glyph renderer, camera framing, result reveal, and playback animation
6. Legacy removal, E2E, ADR/spec deprecation, release/process records
7. Refine the accepted UI from owner review without changing the generic algorithm contracts
8. Refine idle detection, inspector presentation, overflow behavior, and BFS result sequencing after the second owner review
9. Align the Analyze setup panel with existing manager conventions after the third owner review, reusing the Edges node-search control for schema-generated node fields
10. Refine result landmarks, reveal timing, inspector expansion persistence, and trace transport states after the fourth owner review
11. Replace literal Start/End badges and enable Stop/Reset at the final action after the fifth owner review

## TDD

- Domain/app tests: analysis contracts, validation, reducer, checkpoints, cap, BFS, Dijkstra, current-analysis lifecycle, and tool/panel state
- World tests: role priority, glyph lifecycle and sizing, edge-fill direction/progress, reveal budget, reduced motion, and interaction blocking seams
- E2E: `e2e/analyze-laboratory.e2e.ts` replaces the old compare/annotation flows and proves the primary BFS/Dijkstra/result/trace/close/invalidate journeys
- Coverage: keep `src/lib/graph/**` at or above 90%
- Commands: `npm run check`; `npm run lint`; `npm run test:coverage`; `npm run test:e2e`; `npm run build`

## Risks

- Semantic traces can become too large; enforce the event cap and clearly mark partial playback.
- Full-frame storage would grow with graph size; store deltas plus periodic checkpoints.
- Analysis glyphs can clutter dense graphs; allow one primary glyph per entity and keep detailed values in the panel.
- WebGL assertions are brittle; extract pure role, geometry, timing, and interaction helpers for unit coverage and keep E2E at observable behavior seams.
- Removing several shipped capabilities can leave stale commands/tests/docs; inventory by symbol and user-facing label before declaring cleanup complete.
- The Result/Trace panel must block editing without blocking camera controls or accessibility navigation within the panel.
