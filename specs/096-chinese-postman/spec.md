---
id: SPEC-096
item: ITEM-104
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Chinese Postman analysis'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Chinese Postman analysis

- **Status:** Accepted

## Intent

Find a minimum-cost closed walk that traverses every stored undirected edge at least once.

## Scope

**In:** undirected weighted multigraphs; shortest-path distance pairing of odd-degree nodes; exact
minimum-weight perfect matching under an explicit limit; Eulerian circuit reconstruction; Result,
Trace, and Reveal.

**Out:** directed/mixed postman routes, open routes, negative costs, approximate matching, and graph
mutation.

## Domain rules

- Empty graphs return `No result`. A nonempty edgeless graph returns a zero-cost trivial route.
- Every edge must be undirected with a finite nonnegative weight interpreted as traversal cost.
  Parallel edges remain distinct. Self-loops are required once in the base route and do not affect
  degree parity.
- All edge-bearing nodes must lie in one connected component; isolated nodes are ignored for this
  connectivity check. Otherwise return prominent `No result` explaining that one closed route
  cannot cover disconnected edge regions.
- Duplicate shortest paths so every node has even degree, then run deterministic Hierholzer traversal
  over original and duplicated edge traversals. The duplicated traversal count is minimized by an
  exact minimum-weight perfect matching of odd-degree nodes. More than 20 odd-degree nodes returns
  prominent `No result` explaining the matching responsiveness limit.
- Ties use stored node, edge, and path order. A stored edge can appear more than once in the route
  only when the selected augmentation duplicates its traversal. Trace truncation never affects the
  result.

## Presentation rules

- Result reports original edge count, total traversal count, repeated traversal count, and total cost.
  The path artifact lists every node/edge traversal, including repeats.
- Trace exposes odd-degree nodes, shortest path costs, matching pairs, duplicated traversals, and
  Eulerian reconstruction.
- Reveal shows exploratory work temporarily and replays the complete returned walk in green, one
  node/edge action per reveal step.
- Update `docs/analysis-visual-rules.md`; no new visual role is introduced.

## Acceptance scenarios

### Scenario: Odd nodes are paired at minimum added cost

**Given** a connected weighted undirected graph with odd-degree nodes
**When** Chinese Postman runs
**Then** it returns a closed route covering every stored edge and the minimum-cost necessary repeats

### Scenario: Disconnected edge regions are rejected

**Given** two components each contain an edge
**When** Chinese Postman runs
**Then** prominent `No result` explains that one route cannot cover both regions
