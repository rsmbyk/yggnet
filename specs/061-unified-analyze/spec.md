---
id: SPEC-061
item: ITEM-069
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Unified Analyze algorithm laboratory'
created: 2026-09-29
updated: 2026-09-29
---

# Spec: Unified Analyze algorithm laboratory

- **ID:** 061
- **Status:** Accepted
- **Item:** ITEM-069
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

Make Analyze a reusable graph-algorithm laboratory. A user selects an algorithm, supplies inputs described by that algorithm, receives the result first, and can then replay the semantic actions and data structures that produced it. Adding a typical future algorithm must not require another tool, a custom playback panel, or algorithm-owned world rendering.

## Scope

### In scope

- A single Analyze toolbar tool
- Definition-driven algorithm fields and validation
- BFS start-only traversal
- Dijkstra Start-to-End shortest path
- Generic result artifacts, semantic events, roles, inspectors, frame reduction, checkpoints, and trace cap
- One current analysis in memory for the lifetime of the page
- Automatic bounded result reveal
- Blocking Result/Trace panel with camera-only world input
- Analysis-only hybrid glyph layer and visible role legend
- Structural invalidation and safe no-result/error behavior
- Removal/deprecation of superseded Pathfinder, Directions/Travel, A*, run-history, compare, and annotation behavior

### Out of scope

- Algorithms other than BFS and Dijkstra
- Travel, A*, all-simple-path enumeration, or all-equal-shortest-path enumeration
- Saved runs, comparison, annotations, or persistence across reload
- Worker-backed execution
- Custom presentation components supplied by individual algorithms
- Glyph families not needed by BFS or Dijkstra

## Domain rules

### Definitions and inputs

- Every analysis is registered as an `AnalysisDefinition` with a stable id, name, category, description, declarative fields, validator, and execution function.
- Supported field kinds are node, node-set, edge, number, boolean, and enum. The initial definitions use node fields only.
- The Analyze form is generated from field metadata; it contains no BFS- or Dijkstra-specific branches beyond artifact/inspector rendering shared by type.
- Validation runs before execution and returns structured field errors. An invalid request creates no current analysis and no world visualization.
- Runner requests and outputs are structured-clone safe and operate on a serializable graph snapshot.

### Results and artifacts

- `AnalysisResult` records `complete` or `no-result`, summary metrics, and zero or more reusable artifacts.
- Initial reusable artifacts include path, ordered nodes, and tree. The contract reserves node/edge set, partition, ranking, per-edge values, and table for future definitions.
- BFS returns an ordered-node artifact and a BFS-tree artifact for the reachable component.
- Dijkstra returns one path artifact when reachable and metrics named `Length` and `Cost`.
- Dijkstra `Length` is the number of path edges. `Cost` is their summed weight.
- Start=End is a complete Dijkstra result with one node, zero edges, Length 0, and Cost 0.
- An unreachable Dijkstra target is a valid `no-result` outcome with a replayable search trace.
- Dijkstra rejects any input snapshot containing a reachable negative-weight edge because its correctness precondition is not satisfied.

### Semantic trace

- One user-visible trace step is one meaningful semantic action, not one machine instruction and not a whole algorithm phase.
- Events are immutable, ordered, JSON-safe, and contain a stable sequence number, algorithm action key, structured narration references, visual-role deltas, inspector operations, and optional phase/progress metadata.
- Narration stores entity ids and message data rather than copied node labels, so current labels can be rendered safely.
- Core roles are `current`, `inspecting`, `frontier`, `settled`, `result`, and `rejected`.
- Role precedence is deterministic: result, current, inspecting, frontier, settled, rejected.
- Algorithms may declare named extension roles and legend labels, but the world renderer owns colors, shapes, line styles, animation, and reduced-motion treatment.
- Inspector kinds are scalar, queue, stack, set, ordered list, key/value map, and table.
- BFS exposes at least Queue and Visited. Dijkstra exposes at least Unsettled distances, Settled, and Predecessors.
- The reducer applies event deltas to produce `AnalysisFrame` values. It records a checkpoint every 100 retained events and reconstructs backward/arbitrary seeks from the nearest checkpoint.
- At most 50,000 semantic events are retained. The algorithm continues to completion beyond that budget; the result stays correct and the Trace view states that playback is partial.

### Current-analysis lifecycle

- Exactly one `CurrentAnalysis` exists in session memory. A successful new run replaces it.
- It contains the definition id, validated inputs, source revision, result, retained trace, truncation flag, reducer checkpoints, mode, cursor, playback state, and playback speed.
- It is not serialized into graph documents, autosave, named saves, import/export, or local storage.
- Adding/removing a node or edge or changing an edge endpoint, direction, or weight stops playback/reveal and clears the current analysis immediately.
- Label, tag, color, note, and node-position changes do not invalidate the current analysis.
- While Result/Trace is open, graph edits and node movement are blocked; camera orbit, pan, and zoom remain enabled.

### Tool and panel behavior

- Analyze is the only toolbar entry for algorithms and paths. Pathfinder is absent.
- The Analyze tool contains the definition picker, generated fields, inline validation, Run, and—when valid—View last result.
- A completed run closes the Analyze tool and opens the right-side Result/Trace panel.
- The panel is application-modal: other tools, selection, dragging, graph-edit commands, undo/redo, and destructive shortcuts cannot act while it is open.
- Panel controls and camera orbit/pan/zoom remain operable.
- Result and Trace are separate views of the same current analysis. Entering Trace begins at the initial event rather than inheriting the final result frame.
- Trace provides Previous, Play/Pause, Next, a scrubber, and 0.5x, 1x, and 2x speed. Default 1x cadence is approximately 600 ms per semantic action.
- Closing Result/Trace stops animation, removes analysis visuals, preserves the current analysis, and reopens Analyze with its previous definition and inputs.
- View last result reconstructs the result view and glyphs without rerunning the algorithm.

### Result reveal

- Result reveal is derived from result artifacts and is not a replay of the execution trace.
- Before reveal, the camera returns to the canonical orbit/center and fits the whole graph.
- All graph entities begin dimmed; the result is then revealed in artifact order.
- Total reveal duration is clamped to approximately 0.8–3 seconds, independent of result size. Large results advance in batches or a continuous wave.
- Dijkstra reveals the start node, then each path edge filling from the source-side endpoint toward the next node, ending at the target.
- BFS reveals its reachable traversal/tree result in traversal order within the same duration budget.
- Replay restarts framing/reveal. Skip immediately applies the completed result frame.
- Reduced-motion preference removes spatial glyph motion and directional growth and uses a brief opacity transition or the completed frame.

### Hybrid glyph layer

- Base graph node meshes remain unchanged spheres in every state.
- Analysis decorations live in a separate, temporary, non-interactive renderer layer and never enter the graph document, selection, undo/redo, persistence, or raycasting.
- The initial decoration vocabulary is:
  - wireframe cage for the current node;
  - dashed halo plus traveling probe for the node/edge being inspected;
  - under-ring for a frontier/queued node;
  - ring plus check for a settled node;
  - directional ribbon/fill for an accepted or result edge;
  - minimal badge only when an active marker or traversal ordinal materially aids understanding.
- Queue positions, distances, predecessors, scores, and other detailed values appear in panel inspectors, not as dense world text.
- Result view renders only result-artifact decorations. Trace view replaces them with the selected semantic frame; the two sets never accumulate.
- Decorations use shared geometry/materials and pooling or instancing, ignore raycasts, and permit at most one primary glyph per entity.
- Glyphs remain screen-readable with near/far size clamps.
- Color is never the sole distinction: geometry, line style, motion, legend, and reduced-motion equivalents communicate each role.
- Closing/invalidation removes every analysis decoration and restores normal graph opacity immediately. The camera remains where the user left it.

## Acceptance scenarios

### Scenario: Analyze is the single algorithm tool

- **Given** the application toolbar is visible
- **When** the user inspects its tools
- **Then** Analyze is available
- **And** Pathfinder is absent
- **And** no Travel, A*, path-enumeration, compare, history, or annotation controls are present

### Scenario: Run BFS traversal

- **Given** the graph has edges A-B, A-C, A-D, B-E, C-F, E-G, and E-H
- **And** BFS is selected with Start A
- **When** the user runs Analyze
- **Then** the result contains the reachable traversal order and BFS tree
- **And** the trace expresses focus, neighbor inspection, queue operations, visits, accepted tree edges, and settlement as separate semantic actions
- **And** Queue and Visited inspectors match the selected step

### Scenario: Run Dijkstra shortest path

- **Given** a directed or undirected graph with non-negative edge weights
- **And** Dijkstra is selected with valid Start and End nodes
- **When** the user runs Analyze
- **Then** the result is one minimum-cost path when reachable
- **And** Length equals its edge count
- **And** Cost equals its summed edge weight
- **And** distances, predecessors, unsettled, and settled inspectors replay consistently

### Scenario: Dijkstra rejects negative weights

- **Given** a Dijkstra request whose reachable search graph contains a negative-weight edge
- **When** the user attempts to run it
- **Then** Run is blocked with clear validation guidance
- **And** no current analysis or analysis visualization is created

### Scenario: Dijkstra target is unreachable

- **Given** valid Start and End nodes with no traversable route between them
- **When** Dijkstra completes
- **Then** the result reports no path
- **And** the search trace remains available for playback
- **And** no false result path is highlighted

### Scenario: Automatic result reveal

- **Given** an analysis completes successfully
- **When** Result opens
- **Then** the Analyze tool closes and the right-side panel opens
- **And** the camera adopts the canonical fitted graph view
- **And** the graph starts dimmed
- **And** the result reveal finishes within the bounded duration
- **And** the completed artifact and metrics remain visible

### Scenario: Step and scrub through the trace

- **Given** the current analysis has a retained semantic trace
- **When** the user enters Trace and uses Previous, Next, playback, pause, speed, or scrubber controls
- **Then** narration, inspectors, legend, and world glyphs describe the same selected semantic step
- **And** backward/arbitrary movement reconstructs the same frame without rerunning the algorithm

### Scenario: Trace is capped but result remains correct

- **Given** an algorithm emits more than 50,000 semantic events
- **When** it completes
- **Then** its final result is complete and correct
- **And** only the first 50,000 events are retained
- **And** Trace clearly reports that playback is partial

### Scenario: Result/Trace blocks editing but permits camera inspection

- **Given** Result or Trace is open
- **When** the user attempts selection, node dragging, editing, another tool, undo/redo, or a destructive shortcut
- **Then** the graph and tool state do not change
- **But when** the user orbits, pans, or zooms
- **Then** the camera responds normally

### Scenario: Closing analysis removes temporary visuals

- **Given** result or trace glyphs are visible
- **When** the user closes the right-side panel
- **Then** every cage, halo, ring, check, probe, badge, and ribbon disappears
- **And** normal graph opacity returns
- **And** base node shapes and graph data are unchanged
- **And** Analyze reopens with its prior definition and inputs
- **And** View last result can reconstruct the retained analysis

### Scenario: Structural edit invalidates current analysis

- **Given** a current analysis exists and its panel is closed
- **When** a node or edge is added/removed or an edge endpoint, direction, or weight changes
- **Then** the current analysis and any analysis visuals clear immediately
- **But when** a label, tag, color, note, or node position changes
- **Then** the current analysis remains available

### Scenario: Reduced motion preserves meaning

- **Given** the user prefers reduced motion
- **When** result reveal or trace playback changes frames
- **Then** spatial cage/probe motion and directional growth are absent
- **And** opacity, geometry, line style, legend, and the completed state preserve the same meaning

## Traceability

- Domain/app tests: planned under `src/lib/graph/analysis/**`, `src/lib/graph/algorithms/**`, and `src/lib/session/**`
- World tests: planned under `src/lib/world/analysis-*.test.ts`
- E2E: planned `e2e/analyze-laboratory.e2e.ts`; remove superseded compare/annotation E2E files
- Implementation: planned under `src/lib/graph/analysis/**`, `src/lib/session/**`, `src/lib/ui/**`, and `src/lib/world/**`

## Supersession

Implementation will mark behavior removed or replaced by this spec as Deprecated in SPEC-006 through SPEC-014 where applicable and SPEC-034 through SPEC-036, while preserving those files as history. SPEC-061 becomes the current contract for algorithm selection, execution, results, traces, playback, and world analysis visualization.
