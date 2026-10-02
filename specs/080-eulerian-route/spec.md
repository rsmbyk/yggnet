---
id: SPEC-080
item: ITEM-088
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Eulerian route analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Eulerian route analysis

- **Status:** Accepted

## Intent

Show a deterministic route that uses every stored edge exactly once without requiring users to
manually reason about degree and connectivity conditions.

## Scope

**In:** one Eulerian Route definition; auto-selected Path/Circuit mode; optional Start; fully
directed and fully undirected graphs; deterministic Hierholzer traversal; generic Result, Trace,
and Reveal; domain and Playwright coverage.

**Out:** mixed-direction projection, enumerating every route, route optimization, graph mutation,
and custom panels.

## Domain rules

- Empty graphs return `No result`. A nonempty graph with no edges returns the selected Start or
  first stored node as a valid zero-edge route in either mode.
- A graph with edges must be fully directed or fully undirected; mixed directions return
  explanatory `No result`. Edge weights and node positions are ignored.
- Undirected self-loops contribute two to degree; directed self-loops contribute one incoming and
  one outgoing incidence. Parallel edges remain distinct stored edges.
- Edge-bearing vertices must be connected when direction is ignored. Isolated vertices do not
  invalidate an edge-covering route.
- Path mode accepts either an open trail or a closed circuit. Circuit mode requires the returned
  route to close at its first node.
- Standard degree conditions determine eligibility. For directed Path, either all vertices balance
  or exactly one has out-minus-in `1` and one has in-minus-out `1`; Circuit requires all balanced.
  For undirected Path, zero or two vertices have odd degree; Circuit requires zero odd vertices.
- Optional Start means the first route node. When supplied, it must satisfy the applicable degree
  condition; otherwise return explanatory `No result` even if another start could succeed.
- Stored node and edge order break every tie. Result contains a path artifact whose edge IDs are
  exactly the stored edges, each once; a circuit repeats its start node only as the closing node.

## Presentation rules

- Result lists route type, node sequence, edge count, and whether it is closed.
- Trace exposes the current node, remaining eligible edges, traversal stack, and emitted route.
- Reveal replays one real node or edge per step using explicit green path emphasis. Temporary edge
  inspection follows the shared amber/orange rules.
- No new visual role is introduced; implementation must update
  `docs/analysis-visual-rules.md` to record the algorithm's use of existing rules.

## Acceptance scenarios

### Scenario: Deterministic parallel-edge circuit

**Given** an eligible undirected graph with parallel edges and a self-loop
**When** Circuit mode runs
**Then** every stored edge appears exactly once and the route closes using stored-order ties

### Scenario: Optional Start is incompatible

**Given** an eligible open Eulerian path and a selected Start that is not a valid endpoint
**When** Path mode runs
**Then** the prominent `No result` explains why that Start cannot begin the route

### Scenario: Isolated nodes do not block an edge route

**Given** one connected edge-bearing region plus isolated nodes
**When** Eulerian analysis runs
**Then** eligibility and the returned route are determined by the edge-bearing region only
