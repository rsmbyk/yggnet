---
id: SPEC-061
item: ITEM-069
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Unified Analyze algorithm laboratory'
created: 2026-09-29
updated: 2026-09-30
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
- It contains the definition id, validated inputs, source revision, result, retained trace, truncation flag, reducer checkpoints, mode, cursor, and playback state.
- It is not serialized into graph documents, autosave, named saves, import/export, or local storage.
- Adding/removing a node or edge or changing an edge endpoint, direction, or weight stops playback/reveal and clears the current analysis immediately.
- Label, tag, color, note, and node-position changes do not invalidate the current analysis.
- While Result/Trace is open, graph edits and node movement are blocked; camera orbit, pan, and zoom remain enabled.

### Tool and panel behavior

- Analyze is the only toolbar entry for algorithms and paths. Pathfinder is absent.
- The Analyze tool uses the manager header as its only title; it does not repeat an `Analyze` heading inside the panel body.
- The Analyze tool contains the definition picker, generated fields, inline validation, and Run analysis.
- Analyze selects use the same shared control sizing as Generate selects.
- Every schema-generated `node` field uses the same searchable node picker behavior and visual treatment as the Edges Source and Destination fields. Typing filters node labels, selecting a result commits its stable node id, and the field remains keyboard accessible.
- Algorithm, enum, edge, and other non-node fields remain their existing field type unless a future spec supplies a dedicated picker.
- Run analysis uses the same primary footer placement, dimensions, typography, colors, hover, and disabled treatment as Generate.
- When a retained current analysis exists with its Result/Trace panel closed, the manager header shows a `Last result` button at the top right. It is absent before the first valid result and disappears immediately when structural invalidation clears that result.
- A completed run closes the Analyze tool and opens the right-side Result/Trace panel.
- The panel is application-modal: other tools, selection, dragging, graph-edit commands, undo/redo, and destructive shortcuts cannot act while it is open.
- Panel controls and camera orbit/pan/zoom remain operable.
- Result and Trace are separate views of the same current analysis. Entering Trace begins at the initial event rather than inheriting the final result frame.
- The panel follows the existing manager chrome tokens, sizes itself to its content up to the available viewport, uses the algorithm name as its title, and gives Result and Trace equal full-width tabs.
- Result shows one metric per row and the final-artifact legend. It has no repeated summary, Skip animation, Replay, or Analyze steps action.
- Trace orders its contents as media-style controls, scrubber, current action, data structures, and legend.
- Trace provides Previous, Play/Pause/Restart, Stop/Reset, Next, and a scrubber. Playback uses a fixed cadence of approximately 300 ms per semantic action (twice the original cadence); Previous, Next, Stop/Reset, and manual scrubbing pause playback.
- The primary transport uses the conventional play triangle while paused before the final action and the conventional two-bar pause icon while playing; it never substitutes the square stop icon for Pause.
- At the final action, the primary transport becomes Restart. Activating it seeks to action 1 and immediately resumes autoplay from there.
- Stop/Reset is disabled only at action 1. It is enabled at every later action, including the final action, and returns to action 1 while pausing playback.
- Inspector cards are collapsed by default and show a user-facing data-structure name, description, and item count; expanding a card reveals its current data.
- An inspector card's expanded/collapsed state is panel UI state, not trace-frame state. Autoplay and cursor advancement preserve every expanded card; only an explicit user toggle, closing the panel, or replacing/invalidating the analysis may collapse it.
- Missing/uninitialized inspector data and an initialized data structure with zero entries are both presented consistently as `Empty` with count 0.
- Inspector cards use the app hover treatment and animate open/close without horizontal overflow or layout jumps. Reduced-motion preference removes the height transition.
- Trace content keeps one stable full width in every state; scrollbars, range inputs, expanded inspectors, and long values must not introduce intermittent horizontal inset or overflow.
- The main top toolbar is disabled while Result/Trace is open, in addition to the other editing and tool surfaces.
- Closing Result/Trace stops animation, removes analysis visuals, preserves the current analysis, and reopens Analyze with its previous definition and inputs.
- View last result reconstructs the result view and glyphs without rerunning the algorithm.

### Result reveal

- Result reveal is derived from result artifacts and is not a replay of the execution trace.
- Before reveal, the camera returns to the canonical orbit/center and fits the whole graph in the viewport area not covered by the Result/Trace panel.
- All graph entities begin dimmed; the result is then revealed in artifact order.
- Total reveal duration is clamped to approximately 0.7–2.6 seconds, independent of result size. Large results advance in batches or a continuous wave.
- Dijkstra reveals the start node, then each path edge filling from the source-side endpoint toward the next node, ending at the target.
- BFS reveals its reachable traversal/tree result as an alternating traversal sequence: the start node, then each accepted tree edge followed by the node that edge discovered. For A-B, B-C, A-C, A-D, B-E starting at A, the reveal order is A, A-B, B, A-C, C, A-D, D, B-E, E.
- Result has no manual Skip control. The reveal completes on its bounded timer.
- Result distinguishes important landmark nodes from ordinary result nodes with renderer-owned color and non-color-only geometry. Dijkstra marks Start and End separately; BFS marks Start.
- Start uses a cyan diamond-shaped wireframe cage and End uses a green target-like double ring. They do not display literal `S` or `E` badges in the world.
- If Start and End are the same node, one gold combined diamond-and-target treatment communicates both roles without stacking separate primary glyphs.
- The visible Result legend uses matching geometric swatches and names Start and End without letter-badge icons.
- After ten seconds with no user activity in Result, the result reveal replays automatically. Activity includes pointer/mouse movement, pointer/mouse buttons or clicks, wheel/zoom, orbit/pan gestures, touch/pointer actions, and keyboard presses anywhere in the app; every activity restarts the full idle window.
- An idle replay restarts only the artifact reveal. It preserves the current camera position and never requests canonical framing.
- Returning from Trace to Result resets the camera to the panel-aware canonical fitted view before revealing the result again.
- Reduced-motion preference removes spatial glyph motion and directional growth and uses a brief opacity transition or the completed frame.

### Hybrid glyph layer

- Base graph node meshes remain unchanged spheres in every state.
- Analysis decorations live in a separate, temporary, non-interactive renderer layer and never enter the graph document, selection, undo/redo, persistence, or raycasting.
- The initial decoration vocabulary is:
  - wireframe cage for the current node;
  - dashed halo plus traveling probe for the node/edge being inspected;
  - centered ring for a frontier/queued node;
  - centered ring plus check for a settled node;
  - directional ribbon/fill for an accepted or result edge;
  - minimal badge only when an active marker or traversal ordinal materially aids understanding.
- Queue positions, distances, predecessors, scores, and other detailed values appear in panel inspectors, not as dense world text.
- Result view renders only result-artifact decorations. Trace view replaces them with the selected semantic frame; the two sets never accumulate.
- Decorations use shared geometry/materials and pooling or instancing, ignore raycasts, and permit at most one primary glyph per entity.
- Node glyphs keep a stable size relative to their base node as the camera zoom changes.
- Color is never the sole distinction: geometry, line style, motion, legend, and reduced-motion equivalents communicate each role.
- Closing/invalidation removes every analysis decoration and restores normal graph opacity immediately. The camera remains where the user left it.

## Acceptance scenarios

### Scenario: Analyze is the single algorithm tool

- **Given** the application toolbar is visible
- **When** the user inspects its tools
- **Then** Analyze is available
- **And** Pathfinder is absent
- **And** no Travel, A*, path-enumeration, compare, history, or annotation controls are present

### Scenario: Analyze setup follows manager conventions

- **Given** the Analyze tool is open
- **Then** the manager header contains the only Analyze title
- **And** its selects have the same computed height as Generate selects
- **And** each node input is searchable with the same interaction as Edges Source and Destination
- **And** Run analysis matches the Generate primary action in the manager footer
- **And** no Last result action appears without a retained analysis
- **But given** a valid analysis was run and Result/Trace was closed
- **Then** `Last result` appears at the top right of the Analyze header
- **And when** a structural edit invalidates that analysis
- **Then** `Last result` disappears

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

### Scenario: Result landmarks remain distinguishable

- **Given** a BFS or Dijkstra result is visible
- **When** the final artifact is revealed
- **Then** algorithm input landmarks are visually distinct from ordinary result nodes by geometry as well as color
- **And** BFS identifies Start
- **And** Dijkstra identifies Start and End
- **And** a Start=End Dijkstra result uses one combined landmark
- **And** no world landmark or legend swatch uses a literal `S` or `E` badge
- **And** the Result legend names the displayed landmark roles with matching geometric swatches

### Scenario: Idle result replay

- **Given** Result is open and its reveal has completed
- **When** ten seconds pass without pointer, mouse, wheel, touch, camera-control, or keyboard activity
- **Then** only the result-artifact reveal replays
- **And** the camera position and orientation remain unchanged
- **But when** any listed input occurs before the threshold
- **Then** the full ten-second idle window starts again

### Scenario: BFS result reveal follows traversal

- **Given** undirected edges A-B, B-C, A-C, A-D, and B-E
- **And** BFS starts at A
- **When** the result reveal plays
- **Then** its entity order is A, A-B, B, A-C, C, A-D, D, B-E, E
- **And** it never reveals all result nodes before their accepted tree edges

### Scenario: Step and scrub through the trace

- **Given** the current analysis has a retained semantic trace
- **When** the user enters Trace and uses Previous, Next, playback, pause, Stop/Reset, or scrubber controls
- **Then** narration, inspectors, legend, and world glyphs describe the same selected semantic step
- **And** backward/arbitrary movement reconstructs the same frame without rerunning the algorithm
- **And** stepping, resetting, or scrubbing pauses autoplay

### Scenario: Trace transport preserves inspector intent

- **Given** Trace is open and the user expands one or more data structures
- **When** autoplay advances through semantic actions
- **Then** those data structures remain expanded while their displayed contents update
- **And when** playback is active
- **Then** the primary control shows a conventional two-bar Pause icon, never the square Stop icon
- **And when** the cursor reaches the final action
- **Then** the primary control is announced and displayed as Restart
- **And activating Restart** seeks to action 1 and resumes playback
- **And** Stop/Reset is disabled at action 1
- **But when** the cursor is on any later action, including the final action
- **Then** Stop/Reset is enabled and returns to action 1 with playback paused

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

- Domain contracts and algorithms: `src/lib/graph/analysis/{contracts,reducer,algorithms}.ts`
- Domain verification: `src/lib/graph/analysis/analysis.test.ts`
- Current-analysis lifecycle: `src/lib/session/current-analysis.ts` and `current-analysis.test.ts`
- Unified UI: `src/lib/ui/ManagerPanel.svelte`, `AnalysisResultPanel.svelte`, `analysis-panel-policy.ts`, `Toolbar.svelte`, and `src/routes/+page.svelte`
- World roles and glyphs: `src/lib/world/analysis-decoration.ts`, `analysis-decoration.test.ts`, and `GraphScene.svelte`
- Acceptance flow: `e2e/analyze-laboratory.e2e.ts`
- Architecture decision: `docs/adr/008-unified-analysis-laboratory.md`

## Supersession

SPEC-006 through SPEC-014 where applicable and SPEC-034 through SPEC-036 are Deprecated and preserved as history. SPEC-061 is the current contract for algorithm selection, execution, results, traces, playback, and world analysis visualization.
