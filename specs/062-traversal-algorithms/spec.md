---
id: SPEC-062
item: ITEM-070
type: feat
feature_area: analyze
bump: minor
status: Draft
title: 'Traversal and search algorithms'
created: 2026-09-30
updated: 2026-09-30
---

# Spec: Traversal and search algorithms

- **ID:** 062
- **Status:** Draft
- **Item:** ITEM-070
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

Expand Analyze from one traversal into a coherent traversal-and-search laboratory. Users can traverse a reachable graph or search for a Target, see the final result immediately, watch a concise reveal of everything explored before the result, and use Trace to inspect the detailed algorithm state.

## Scope

### In scope

- BFS Traverse and Search modes
- DFS Traverse and Search modes
- Multi-source BFS Traverse and Search modes
- Depth-Limited DFS Traverse and Search modes
- Iterative Deepening DFS Traverse and Search modes
- Bidirectional BFS Search-only definition
- Random Walk Traverse and Search modes
- Generic result reveal phases for waves, resets, revisits, footprint retention, and final emphasis
- Conditional generated inputs, validation, metrics, artifacts, semantic traces, inspectors, world reveal, and Playwright acceptance

### Out of scope

- Additional traversal, structural-analysis, informed-search, or weighted-path definitions
- Per-algorithm presentation components or algorithm-owned visual styling/timing
- Configurable neighbor-order strategies
- Dijkstra changes
- Analysis persistence, comparison, annotations, or worker execution

## Draft assumptions to review

- Neighbor order follows the graph document's stable edge order; no sorting control is added.
- Random Walk defaults Max steps to 100, accepts integer values from 1 through 10,000, and accepts an optional unsigned 32-bit integer Seed.
- A generated Random Walk seed is not written back into the setup form, but the exact used seed is retained with the current analysis and shown in Result metrics.
- Search finds a Target node, not a predicate, tag, label, edge, or set of targets.

## Domain rules

### Catalog and generated inputs

- The Analyze catalog contains BFS, DFS, Multi-source BFS, Depth-Limited DFS, Iterative Deepening DFS, Bidirectional BFS, Random Walk, and the unchanged Dijkstra definition.
- BFS, DFS, Multi-source BFS, Depth-Limited DFS, IDDFS, Bidirectional BFS, and Random Walk use category `Traversal`; Dijkstra remains `Shortest path`.
- BFS and DFS require Mode and Start. Search mode additionally requires Target.
- Multi-source BFS requires Mode and one or more ordered Starts. Search mode additionally requires Target.
- Depth-Limited DFS requires Mode, Start, and integer Max depth at least 0. Search mode additionally requires Target.
- IDDFS requires Mode and Start. Search mode additionally requires Target; it has no Max depth input.
- Bidirectional BFS requires Start and Target and exposes no Mode field.
- Random Walk requires Mode, Start, and Max steps; Search mode additionally requires Target. Seed is an optional normal number field and no advanced section is added.
- Fields irrelevant to the selected mode are absent, not merely disabled. Changing Mode preserves still-relevant values and does not submit hidden values.
- Start=Target is an immediate complete Search result at depth/length 0 where applicable.
- All definitions operate on structured-clone-safe snapshots and outputs.

### Shared traversal and search semantics

- Every definition respects edge direction. Traversal from a node follows outgoing directed edges and either direction of an undirected edge.
- Traverse mode visits the reachable graph according to the definition and returns an ordered-node artifact plus a traversal tree or forest where applicable.
- Search mode stops according to the definition's target rule, returns a path when found, and returns `no-result` when the target is not found within the definition's termination boundary.
- A Search result includes its explored ordered nodes and accepted traversal edges as artifacts even when no path is found.
- Search Result reveal shows the explored footprint accumulated before termination, then gives a found path stronger renderer-owned emphasis. The footprint remains visible with subordinate styling after reveal completion.
- Trace contains the detailed queue, stack, frontier, visit, inspection, acceptance/rejection, restart, cutoff, and termination actions appropriate to the definition.
- BFS, DFS, Multi-source BFS, and each side of Bidirectional BFS visit one node at most once per run. Depth-first bounded searches prevent cycles on the current path but may revisit a node through another branch so an earlier deeper route cannot suppress a later shallower route.
- Metrics use final values from the completed execution and never change while Result reveal plays.

### BFS and DFS

- BFS Traverse preserves SPEC-061's reachable breadth-first traversal and BFS tree.
- BFS Search explores in breadth layers and returns a fewest-edge path to Target.
- DFS uses an explicit stack-equivalent deterministic depth-first order and returns a DFS tree.
- DFS Search stops at the first Target encounter and returns that DFS path; it does not claim the path is shortest.
- BFS exposes Queue and Visited inspectors. DFS exposes Stack and Visited inspectors.

### Multi-source BFS

- Multi-source BFS initializes one shared queue from all unique Starts in user selection order.
- Traverse returns one combined breadth-first visit order and a BFS forest rooted at the selected Starts.
- Search returns a fewest-edge path from a selected Start to Target.
- If multiple Starts reach Target at the same minimum depth, the earliest Start in user selection order wins.
- All Starts are revealed together, followed by one concurrent reveal step for every breadth layer across all active sources.
- Trace and inspectors preserve deterministic source ownership, predecessor, shared Queue, and Visited state.

### Depth-Limited DFS

- Max depth 0 visits only Start. Depth counts path edges from Start.
- Traverse explores every reachable path permitted by Max depth and returns the unique visited order and accepted traversal tree.
- Search returns the first DFS path to Target whose length is no greater than Max depth.
- A branch reaching Max depth emits a visible cutoff action in Trace and does not expand neighbors.
- Result distinguishes exhausted-within-limit from found; it does not claim that nodes beyond Max depth are unreachable.
- Inspectors expose Stack, Visited/current-path state, and the fixed depth limit.

### Iterative Deepening DFS

- IDDFS executes depth-limited DFS repeatedly with limits 0, 1, 2, and so on.
- Search stops after the first iteration that finds Target or after an iteration proves no deeper reachable node remains.
- Traverse stops after an iteration proves the reachable graph is fully explored.
- Search returns the first path from the successful depth iteration; its final metrics include `Found depth`. Traverse final metrics include `Explored depth`, the deepest limit required for exhaustion.
- Result metrics are final and visible from the moment Result opens. They do not display or mutate to the iteration currently being animated.
- Result reveal contains one phase per executed depth limit. Each phase clears the prior traversal decoration, restarts from Start, and animates that iteration's traversal. Phases continue automatically with a brief renderer-owned reset transition.
- The completed reveal retains only the final iteration's footprint and, in Search mode, emphasizes the found path.
- Trace retains every iteration and explicitly resets Stack and iteration-scoped Visited/current-path inspectors between limits.

### Bidirectional BFS

- Bidirectional BFS is Search-only because Target is the second search origin.
- It expands breadth frontiers from Start over outgoing traversable edges and from Target over incoming traversable edges; undirected edges are traversable from either side.
- It returns a fewest-edge Start-to-Target path when one exists and `no-result` otherwise.
- Equal-depth frontier work is processed deterministically and the chosen meeting point/path is deterministic for an unchanged snapshot.
- Result reveal begins with Start and Target together, then expands both sides concurrently by breadth wave until they meet, retains both explored footprints, and emphasizes the joined path.
- The renderer visually distinguishes Start-side and Target-side frontiers by shared geometry/style semantics, not algorithm-owned colors.
- Trace exposes both Queues, both Visited/predecessor maps, frontier side, meeting candidates, and the selected meeting point.

### Random Walk

- Random Walk chooses uniformly among the current node's traversable outgoing neighbors using a deterministic seeded pseudo-random generator.
- Traverse stops at Max steps or earlier at a node with no traversable neighbor.
- Search stops when Target is reached, Max steps is exhausted, or a dead end is reached.
- Revisited nodes and edges remain valid walk steps. Result reports Steps, Unique nodes, and Seed; Search also reports whether Target was found.
- If Seed is omitted, the runner generates an unsigned 32-bit seed before execution. The exact used seed is stored in validated/current inputs and always displayed in Result metrics.
- Re-running the same snapshot and effective inputs, including Seed, produces the same walk, result, reveal timeline, and semantic Trace.
- Result reveal follows the walk step by step. A revisit re-animates the incoming edge and applies a distinct temporary revisit pulse/highlight to the node.
- Reveal never adds a visit-count badge or any other persistent revisit badge to a world node.
- Trace narration and inspectors may show the visit number; the world reveal does not.
- Inspectors expose Current node, Step, Visit history, and per-node visit counts.

### Generic result reveal timeline

- Result reveal remains derived from completed output and is not semantic Trace playback.
- `AnalysisResult` includes a structured-clone-safe reveal timeline containing phases and ordered steps.
- One step contains one or more semantic actions that occur concurrently. Supported meanings cover revealing nodes/edges, resetting transient footprint state, pulsing a revisit, and emphasizing final artifacts.
- Algorithms may group semantic actions but never provide colors, geometry, CSS classes, Three.js values, wall-clock duration, or easing.
- The shared renderer maps reveal meanings to visuals, reduced-motion equivalents, legend entries, and a total bounded playback policy.
- A reset removes prior phase traversal decorations without changing camera position, Result metrics, artifacts, or retained analysis.
- Search footprints include every node visited and every accepted traversal/walk edge before termination. Frontier nodes discovered but never visited are not falsely reported as traversed.
- Multi-source BFS and Bidirectional BFS use concurrent steps for equal-depth waves; they must not serialize sources into visually separate runs.
- Random Walk revisit actions can target an already visible node and edge without removing the accumulated footprint.
- IDDFS phase resets are the only selected definition behavior that clears an earlier exploration footprint during one Result reveal.
- Result reveal and its idle replay use the same timeline and produce the same completed frame without rerunning the algorithm.
- Reduced motion removes spatial growth/pulsing but preserves concurrency, resets, revisits, footprint/path distinction, and final meaning through immediate geometry/opacity changes.

### Existing Analyze behavior

- SPEC-061 remains authoritative for the current-analysis lifecycle, structural invalidation, Result/Trace panel, interaction blocking, camera framing, idle replay, semantic event cap, checkpoint seeking, glyph ownership, close/resume behavior, and accessibility except where SPEC-062 explicitly extends result reveal.
- No selected algorithm adds a toolbar entry, custom panel, custom Svelte component, or direct world-rendering dependency.
- A result reveal may finish within a larger bounded duration than SPEC-061's single-phase reveal when IDDFS contains several iterations, but each phase and the total remain bounded by shared policy and reduced-motion handling.

## Acceptance scenarios

### Scenario: Catalog and conditional modes

- **Given** Analyze is open
- **Then** the catalog contains BFS, DFS, Multi-source BFS, Depth-Limited DFS, IDDFS, Bidirectional BFS, Random Walk, and Dijkstra
- **And** every selected traversal definition except Bidirectional BFS offers Traverse and Search modes
- **And** Bidirectional BFS is labeled Search-only
- **And when** Search mode is selected
- **Then** Target is required
- **But when** Traverse mode is selected
- **Then** Target is absent and is not submitted

### Scenario: DFS traversal and search

- **Given** a directed, cyclic graph with a deterministic edge order
- **When** DFS Traverse runs from Start
- **Then** each reachable node is visited once in deterministic depth-first order
- **And** the result contains a DFS tree
- **But when** DFS Search runs with Target
- **Then** it stops at the first Target encounter, returns that path, and does not label it shortest
- **And** Search Result reveal retains the explored footprint behind the emphasized path

### Scenario: Multi-source BFS expands concurrently

- **Given** two or more ordered Starts in one graph
- **When** Multi-source BFS runs
- **Then** all Starts initialize one combined traversal
- **And** the result contains one ordered traversal and BFS forest
- **And** Result reveal shows all Starts together and every equal-distance wave together
- **And when** two Starts reach a Search Target at equal depth
- **Then** the earliest selected Start owns the returned path

### Scenario: Depth-Limited DFS honors the cutoff

- **Given** Start, Max depth, and a graph with nodes both within and beyond that limit
- **When** Depth-Limited DFS runs
- **Then** no path expands beyond Max depth
- **And** Trace marks each cutoff
- **And** Search returns the first in-limit Target path or clearly reports no result within the limit

### Scenario: IDDFS repeats its Result animation

- **Given** IDDFS requires limits 0 through 3 to find Target
- **When** Result reveal plays
- **Then** it animates the limit-0 traversal, clears it, and restarts from Start for limits 1, 2, and 3
- **And** the animation repeats the actual traversal performed at every limit
- **And** the Result metric displays final `Found depth: 3` throughout the reveal
- **And** no live iteration number replaces or mutates that final metric
- **And** the completed frame retains the limit-3 footprint and emphasizes the path

### Scenario: IDDFS exhausts a graph

- **Given** IDDFS Traverse runs on a finite reachable graph
- **When** an iteration proves no deeper reachable node remains
- **Then** execution stops without requiring Max depth input
- **And** Result reports the final Explored depth
- **And** the final reveal phase contains the complete reachable traversal footprint

### Scenario: Bidirectional BFS searches from both ends

- **Given** Start and Target are connected by an unweighted directed or undirected route
- **When** Bidirectional BFS runs
- **Then** it returns a fewest-edge path
- **And** the target-side search respects incoming direction on directed edges
- **And** Result reveal expands both frontiers during the same wave steps until they meet
- **And** the two footprints remain distinguishable before the joined path is emphasized

### Scenario: Search has no result

- **Given** a valid systematic Search request whose Target cannot be reached within its termination boundary
- **When** the analysis completes
- **Then** Result reports `no-result`
- **And** its explored footprint is still revealed and retained
- **And** no false path is emphasized
- **And** the full semantic Trace remains available subject to the existing trace cap

### Scenario: Seeded Random Walk is reproducible

- **Given** the same snapshot, Start, Mode, Max steps, Target if applicable, and Seed
- **When** Random Walk runs more than once
- **Then** every run produces the same walk, metrics, reveal, and Trace
- **And** Result metrics display the used Seed
- **But given** Seed is omitted
- **Then** a valid seed is generated before execution and Result metrics display that generated value

### Scenario: Random Walk clearly revisits without badges

- **Given** a Random Walk revisits a visible node
- **When** that reveal step plays
- **Then** its incoming edge animates again
- **And** the node receives a distinct temporary revisit pulse/highlight
- **And** the accumulated footprint remains visible
- **And** no visit-count or revisit badge appears on the node
- **And** Trace narration and inspectors identify the visit number

### Scenario: Reduced motion preserves extended reveal meaning

- **Given** reduced motion is enabled
- **When** a multi-source wave, bidirectional wave, IDDFS restart, or Random Walk revisit is revealed
- **Then** no spatial growth or pulse animation is required
- **And** concurrent membership, phase resets, revisits, explored footprint, and final path remain distinguishable

## Boundaries

- **Always:** use TDD for algorithm and reveal contracts; keep graph-domain coverage at least 90%; preserve structured-clone safety; test directed, cyclic, disconnected, and deterministic cases; add Playwright for visible acceptance.
- **Ask first:** add dependencies; change the 50,000-event cap; change SPEC-061 lifecycle/camera/edit-blocking behavior; add new field/artifact families beyond what this spec requires.
- **Never:** add algorithm-specific UI/world branches; encode renderer styling or timing in algorithms; claim DFS/DLS/IDDFS/Random Walk paths are shortest; persist analysis decorations in graph data; use a world badge for Random Walk revisits.

## Commands

- Check: `npm run check`
- Lint: `npm run lint`
- Unit/coverage: `npm run test:coverage`
- E2E: `npm run test:e2e`
- Build: `npm run build`

## Traceability

- Planned domain contracts/definitions: `src/lib/graph/analysis/**`
- Planned session/UI integration: `src/lib/session/current-analysis.ts`, `src/lib/ui/ManagerPanel.svelte`, `src/lib/ui/AnalysisResultPanel.svelte`
- Planned reveal policy/world integration: focused helpers under `src/lib/world/**` and `src/lib/world/GraphScene.svelte`
- Planned acceptance flow: `e2e/analyze-laboratory.e2e.ts`

## Relationship to SPEC-061

SPEC-061 remains Accepted and defines the unified Analyze laboratory. SPEC-062 extends its algorithm catalog and result-reveal contract; it does not supersede the laboratory, lifecycle, or presentation architecture.
