---
id: SPEC-063
item: ITEM-071
type: fix
feature_area: analyze
bump: patch
status: Accepted
title: 'Traversal result clarity and pacing'
created: 2026-09-30
updated: 2026-09-30
---

# Spec: Traversal result clarity and pacing

- **ID:** 063
- **Status:** Accepted
- **Item:** ITEM-071
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** patch

## Intent

Make traversal Result reveals immediately understandable. Inputs begin in a valid visible state, Start and End are unmistakable, exploration and the returned path have a consistent visual sequence, unsuccessful searches cannot be overlooked, iterative depths are readable, and Random Walk stops when its work is actually finished.

## Scope

### In scope

- Generic first-option initialization for unset Analyze enum fields
- More prominent shared Start, End, and combined landmark glyphs
- Common traversal reveal roles for orange traversed objects and a green final path replay
- Removal of purple Multi-source edge overlays and green target-side Bidirectional edge overlays
- Prominent no-result Result status
- A fixed 180 ms reveal-step interval shared by every traversal algorithm
- A shorter shared 300 ms pause between IDDFS result-reveal phases
- Random Walk early termination on Target found or complete outgoing-reachable coverage
- Actual Random Walk step metric and summaries
- Regression tests and visible acceptance flows

### Out of scope

- Algorithm additions or changes to deterministic neighbor order
- User-selectable colors, themes, animation speed, or pause duration
- Trace transport or inspector redesign
- Graph-data mutation or persisted result decoration
- Dijkstra behavior changes

## Domain rules

### Enum initialization

- When an Analyze enum field has no explicit stored value, its first declared option is its normalized value.
- The generated select displays that same value; it must never show an empty state when options exist.
- An explicit stored selection remains authoritative when the user returns to the algorithm.
- Field visibility and validation consume the normalized value, so Mode-dependent Target fields agree with what the select displays.

### Reveal color and ordering semantics

- Every traversed node and every edge actually used to discover, revisit, or reach it uses orange.
- An active step may use a brighter orange pulse, but completed traversal remains orange rather than changing to green.
- Traverse mode finishes with its whole retained traversal footprint orange and introduces no final-path color.
- A successful Search first reveals the orange traversal through the Target, then replays the returned path in order from Start to Target using green.
- The final frame retains non-path explored objects in orange and keeps the complete returned path green.
- A no-result Search retains only its orange explored footprint and never emits path-replay steps.
- Color names define the semantic palette; exact accessible color values remain renderer-owned.

### Endpoints

- Start and End landmarks are shared across algorithms and remain visible above footprint and path decoration.
- Their world glyphs are at least 1.8 times the ordinary traversal-ring scale, higher contrast, and use a solid visual element rather than only a thin wireframe.
- Start and End use different geometry, not color alone. A node serving both roles uses a distinct combined marker.
- Endpoint glyphs remain legible with reduced motion and when the graph is viewed at supported zoom distances.

### Multi-frontier edges

- Multi-source and Bidirectional BFS retain simultaneous same-wave reveal steps.
- Every revealed line references an existing graph edge and is drawn strictly between that edge's stored `from` and `to` endpoints; analysis never infers endpoints from traversal-order indexes or fabricates a connection.
- Whenever a non-start node becomes visited, the real discovery/walk edge that reached it is highlighted in the same reveal step and remains in the traversal footprint.
- Multi-source edges do not use a purple frontier line.
- Bidirectional target-side edges do not use a green line.
- All exploration edges use the common orange traversal palette.
- Source-side and target-side identity is carried by distinct node-frontier markers while those waves are active.
- The analysis overlay aligns with the underlying edge and must not read as a second offset or detached line.

### No result

- `no-result` renders a prominent status surface before ordinary metrics and the legend.
- The surface includes the explicit heading `No result` and the algorithm's explanatory summary.
- Status is conveyed through text and structure, not color alone, and is announced accessibly when the Result opens.
- The explored footprint remains visible behind the Result panel.

### Reveal pacing and IDDFS

- Every traversal algorithm uses the same fixed 180 ms interval per generic reveal step; concurrent actions inside one step still appear together.
- Result size does not compress or expand that per-step interval.

- Each IDDFS depth remains a separate generic reveal phase beginning with a footprint reset after depth 0.
- A 300 ms hold occurs between the completion of one phase and the reset/start of the next.
- There is no hold before depth 0 or after the final phase.
- The final Found depth or Explored depth metric remains immutable throughout playback.
- Reduced-motion mode resolves the complete result immediately without timed holds while preserving the final phase's footprint and path.

### Random Walk termination and metrics

- Reachable coverage is computed from Start using the same legal outgoing-neighbor semantics as the walk.
- Random Walk stops at the earliest of:
  1. Search Target found;
  2. every outgoing-reachable node visited at least once;
  3. the current node has no legal outgoing move;
  4. Max steps reached.
- Search stops on Target even when other reachable nodes remain unvisited.
- Traverse stops on complete reachable coverage even when Max steps remains.
- Search whose Target is unreachable stops on complete reachable coverage and returns `no-result` without spending the remaining Max steps.
- `Steps taken` equals the number of traversed edges, including edges used for revisits; the starting node is not a step.
- The used Seed remains reported, and identical snapshot/input/seed values remain reproducible.

## Acceptance scenarios

### Scenario: Mode begins on its first option

- **Given** a mode-capable traversal is selected with no stored Mode value
- **When** Analyze renders and validates its generated fields
- **Then** Mode displays and normalizes to the first option, `Traverse`
- **And** the control never appears empty
- **And** switching to Search still reveals and requires Target

### Scenario: Traverse finishes in orange

- **Given** any systematic traversal runs in Traverse mode
- **When** its Result reveal reaches the final step
- **Then** every retained visited node and every discovery/walk edge is orange
- **And** no green final-path decoration is introduced

### Scenario: Search replays the found path

- **Given** a traversal Search reaches its Target after exploring one or more branches
- **When** exploration through the Target finishes
- **Then** the explored footprint remains orange
- **And** the returned path replays again from Start to Target in order
- **And** replayed path nodes and edges are green
- **And** the final frame keeps non-path traversal orange and the full path green

### Scenario: Endpoints dominate result decoration

- **Given** a traversal Result is revealing or complete
- **When** Start and End are visible in the world
- **Then** their distinct solid, high-contrast glyphs remain recognizable above footprint and path decoration at at least 1.8 times ordinary traversal-ring scale
- **And** a shared Start/End node receives the combined glyph
- **And** meaning does not depend on color alone

### Scenario: No result cannot be missed

- **Given** a Search terminates without a path
- **When** Result opens
- **Then** a prominent `No result` status surface appears before metrics and legend
- **And** it includes the explanatory summary
- **And** assistive technology receives the status
- **And** the explored footprint remains visible without green path decoration

### Scenario: IDDFS separates depth iterations

- **Given** IDDFS requires more than one depth iteration
- **When** Result reveal moves from depth N to depth N+1
- **Then** the completed depth-N footprint holds for 300 ms
- **And** the next phase resets and begins after that hold
- **And** the final depth metric never changes during playback
- **But when** reduced motion is active
- **Then** the completed final result appears immediately

### Scenario: Random Walk stops when its work is complete

- **Given** Random Walk has a Max steps value larger than the work needed
- **When** Search reaches Target or the walk visits every outgoing-reachable node
- **Then** it stops immediately without consuming the remaining limit
- **And** `Steps taken` reports the exact number of traversed edges
- **And** the used Seed and reproducibility are preserved

### Scenario: Multi-frontier reveals do not create mystery lines

- **Given** Multi-source or Bidirectional BFS reveals simultaneous frontier waves
- **When** exploration edges appear
- **Then** every line uses the stored endpoints of a real graph edge
- **And** every visited non-start node retains the real edge that reached it
- **And** edges remain orange unless they belong to the green returned path
- **And** no purple Multi-source edge or green target-side edge appears
- **And** distinct node-frontier markers still communicate which side is expanding

## Boundaries

- **Always:** keep reveal actions structured-clone-safe; use generic roles and scheduling; preserve simultaneous wave steps; keep graph coverage at least 90%; add Playwright for visible behavior.
- **Ask first:** change the 180 ms reveal interval, change the 300 ms phase hold, change the shared palette meanings, remove Random Walk Max steps, or change Trace speed.
- **Never:** add algorithm-specific UI/world components, fabricate graph edges, persist reveal decoration, hide explored Search footprints, or use color as the only endpoint/frontier distinction.

## Commands

- Check: `npm run check`
- Lint: `npm run lint`
- Unit/coverage: `npm run test:coverage`
- E2E: `npm run test:e2e -- --workers=1`
- Build: `npm run build`

## Traceability

- Domain/app implementation and tests: `src/lib/graph/analysis/algorithms.ts`, `src/lib/graph/analysis/contracts.ts`, `src/lib/graph/analysis/traversal-algorithms.test.ts`, `src/lib/session/app.svelte.ts`, `src/lib/session/app.test.ts`
- Renderer policy and tests: `src/lib/world/analysis-decoration.ts`, `src/lib/world/analysis-decoration.test.ts`, `src/lib/world/GraphScene.svelte`
- Result and generated-form UI: `src/lib/ui/ManagerPanel.svelte`, `src/lib/ui/AnalysisResultPanel.svelte`, `src/lib/ui/analysis-panel-policy.ts`, `src/lib/ui/analysis-panel-policy.test.ts`
- Acceptance flow: `e2e/analyze-laboratory.e2e.ts`
- Final verification: `npm run check`; `npm run lint`; `npm run test:coverage` (441 passed, 90.33% branches); `npm run test:e2e -- --workers=1` (58 passed); `npm run build`

## Relationship to SPEC-062

SPEC-062 remains Accepted and defines the traversal catalog and generic reveal timeline. SPEC-063 refines the presentation semantics, pacing, and Random Walk termination of that work while both remain in draft PR #38.
