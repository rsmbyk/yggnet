---
id: SPEC-081
item: ITEM-089
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Hamiltonian route analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Hamiltonian route analysis

- **Status:** Accepted

## Intent

Find one exact route that visits every node once while keeping exponential work bounded and
understandable in the interactive Analyze tool.

## Scope

**In:** one Hamiltonian Route definition; auto-selected Path/Circuit mode; optional Start; fully
directed and fully undirected graphs; exact bitmask dynamic programming; a 20-node limit; generic
Result, Trace, and Reveal; domain and Playwright coverage.

**Out:** mixed-direction projection, approximate or heuristic routes, enumerating all routes,
weighted traveling-salesperson optimization, and custom panels.

## Domain rules

- Empty graphs return `No result`. Graphs with more than 20 nodes return prominent `No result`
  stating that exact Hamiltonian analysis is limited to 20 nodes to keep Analyze responsive.
- A graph with edges must be fully directed or fully undirected; mixed directions return
  explanatory `No result`. Weights and positions are ignored.
- Path mode reconstructs the first full-node route. When its final node has an unused compatible
  stored edge back to the first node, it appends the earliest such edge and returns the route as
  closed; otherwise it returns the open path. Circuit mode requires that closing edge.
- Optional Start fixes the first route node. Without it, stored node order initializes candidate
  starts. Stored node order breaks state ties, and the first compatible stored edge represents each
  transition when parallel edges exist.
- A one-node Path succeeds. A one-node Circuit succeeds only with a stored self-loop. A two-node
  undirected Circuit requires two distinct stored parallel edges so no edge is reused.
- Unsatisfiable graphs return `No result` without a persistent graph footprint.
- Result contains one deterministic path artifact; a circuit repeats its start only as the closing
  node and uses each returned stored edge at most once.

## Presentation rules

- Result lists route mode, visited-node count, edge count, and whether it is closed.
- Trace exposes DP layer/state counts, candidate transitions, retained parent decisions, and final
  reconstruction. Existing 50,000-event truncation never changes Result computation.
- Reveal replays one real node or edge per step using explicit green path emphasis; rejected or
  inspected transitions remain temporary.
- No new visual role is introduced; implementation must update
  `docs/analysis-visual-rules.md` to record the exact-route and size-limit behavior.

## Acceptance scenarios

### Scenario: Exact route at the supported boundary

**Given** an eligible graph with 20 nodes and a Hamiltonian route
**When** analysis runs
**Then** it returns one deterministic route using only real stored edges

### Scenario: Exact-search limit is visible

**Given** a graph with 21 nodes
**When** Hamiltonian analysis runs
**Then** prominent `No result` explains the 20-node responsiveness limit

### Scenario: Optional Start constrains reconstruction

**Given** several Hamiltonian routes and a compatible selected Start
**When** analysis runs
**Then** the returned route begins at that node and remaining ties use stored order
