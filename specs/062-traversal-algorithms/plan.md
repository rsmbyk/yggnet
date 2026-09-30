# Plan 062: Traversal and search algorithms

- **Status:** Draft
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-070
- **Bump:** minor

## Why

Analyze currently demonstrates breadth-first traversal and Dijkstra shortest path, but it cannot compare the main traversal strategies or use a traversal to search for a target. The next slice should make the laboratory useful for teaching and inspecting traversal behavior while retaining SPEC-061's result-first, definition-driven architecture.

## Scope / edges

**In:**

- Add DFS, Multi-source BFS, Depth-Limited DFS, IDDFS, Bidirectional BFS, and seeded Random Walk definitions
- Add Traverse/Search modes to BFS, DFS, Multi-source BFS, Depth-Limited DFS, IDDFS, and Random Walk
- Keep Bidirectional BFS Search-only and Dijkstra unchanged
- Add generic, structured-clone-safe reveal phases that are separate from semantic Trace events
- Reveal Search exploration footprints before emphasizing the returned path
- Animate Multi-source and bidirectional frontiers concurrently by breadth layer
- Replay every IDDFS depth iteration while keeping displayed Result metrics final
- Make Random Walk revisits unmistakable without persistent node badges
- Directed-edge, disconnected, cyclic, unreachable, deterministic-order, reduced-motion, coverage, and E2E verification

**Out:**

- A*, greedy/beam search, 0-1 BFS, bidirectional DFS, connected components, SCC, topological sort, cycle detection, flood fill, and Eulerian traversal
- Per-algorithm panels, colors, meshes, animation timing, or renderer branches
- User-configurable neighbor ordering or heuristic functions
- Saved runs, comparison, workers, or persistence changes
- Changes to Dijkstra behavior

## Approach

1. Extend the generic analysis result contract with a semantic reveal timeline. A phase contains ordered reveal steps; one step may act on several entities concurrently. Actions express reveal, revisit, reset, and final emphasis without naming colors, geometry, or durations.
2. Keep Result and Trace independent. Result metrics and artifacts are final immediately; the reveal timeline supplies only the bounded visual sequence. Trace retains detailed narration, frontier/stack/queue inspectors, and reversible semantic events.
3. Share traversal primitives for deterministic outgoing-neighbor access, path reconstruction, modes, validation, and reveal emission. Definitions remain separately testable and expose only declarative fields.
4. Render simultaneous BFS sources/frontiers as one reveal step per breadth layer. Use reset boundaries between IDDFS iterations and revisit actions for Random Walk.
5. Preserve SPEC-061 lifecycle, invalidation, interaction blocking, idle replay, camera behavior, event cap, and renderer ownership.

## Interface direction

- `AnalysisDefinition` continues to own metadata, fields, validation, and execution.
- A mode-capable definition declares an enum field with `traverse` and `search`; Target is conditionally required only for Search.
- `AnalysisResult` gains a serializable reveal timeline composed of phases, steps, and semantic entity actions.
- Reveal steps support multiple concurrent actions; they do not encode wall-clock timing, colors, meshes, or Svelte/Three.js values.
- Trace events remain the sole source for instructional playback and inspectors.
- Result artifacts remain the sole source for final meaning: traversal order/forest, explored footprint, returned path, landmarks, and metrics.

## Delivery order

1. Reveal timeline contracts, validation/default seams, renderer policy, and tests
2. BFS modes, DFS, and Depth-Limited DFS
3. Multi-source BFS and Bidirectional BFS concurrent waves
4. IDDFS iterative result reveal and trace resets
5. Seeded Random Walk and revisit treatment
6. Generated form behavior, Result integration, E2E, quality gate, and delivery records

## TDD

- Domain: exact orders, trees/forests, paths, waves, depth cutoffs, iterations, seed reproducibility, revisits, directed edges, cycles, unreachable targets, and validation
- Session/UI: conditional fields, defaults, immutable final metrics, result/trace separation, idle replay, and reduced motion
- World: concurrent reveal steps, resets, footprint persistence, path emphasis, revisit pulse, edge replay, and no badges
- E2E: representative Traverse/Search runs, multi-frontier reveal, IDDFS restarts, and seeded Random Walk replay
- Coverage: keep `src/lib/graph/**` at or above 90%
- Commands: `npm run check`; `npm run lint`; `npm run test:coverage`; `npm run test:e2e`; `npm run build`

## Risks

- A generic timeline could become a second trace; constrain it to result-reveal semantics and keep inspectors/narration in Trace.
- IDDFS repeats work and Random Walk may revisit indefinitely; terminate IDDFS on success/exhaustion and bound Random Walk by validated Max steps.
- Sequential event storage can accidentally serialize concurrent frontiers; group equal-depth actions explicitly in one reveal step.
- Directed bidirectional search is easy to implement incorrectly; the target-side frontier must traverse incoming edges and tests must prove shortest unweighted paths.
- Dense explored footprints can obscure the final path; retain the footprint with subordinate styling and give the path renderer-owned emphasis.
