---
id: SPEC-079
item: ITEM-087
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Flow network analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Flow network analysis

- **Status:** Accepted

## Intent

Analyze how much capacity can move from a selected Source to Sink, and identify the bottleneck cut
that limits it.

## Scope

**In:** Ford-Fulkerson, Edmonds-Karp, Dinic Maximum Flow, and Minimum Cut definitions; Source/Sink
fields; edge-weight-as-capacity semantics; deterministic residual traces; standard Result, Trace,
and Reveal artifacts; domain, world/UI, and Playwright coverage.

**Out:** lower bounds/demands, costs, multi-source or multi-sink flow, undirected capacity
projection, user-editable residual networks, and custom panels.

## Domain rules

- Edge weight is a finite non-negative capacity. Every edge must be directed; undirected or mixed
  graphs, negative/non-finite capacities, empty graphs, missing nodes, and identical Source/Sink
  return explanatory `No result`.
- Stored edge order is the deterministic tie-breaker. Residual reverse arcs are internal only and
  never appear as fabricated graph edges.
- Ford-Fulkerson chooses augmenting paths with deterministic depth-first search; Edmonds-Karp uses
  deterministic breadth-first search; Dinic uses deterministic BFS level graphs and DFS blocking
  flows.
- Each maximum-flow result reports maximum flow, augmentation count, and per-stored-edge final flow;
  only real edges carrying final positive flow persist in the Result.
- Minimum Cut derives the sink-unreachable partition from the final deterministic residual network.
  It returns source-side and sink-side partitions, actual stored cut edges, and total cut capacity;
  this capacity equals maximum flow.

## Presentation rules

- Temporary residual-path work uses shared roles. Reverse residual arcs are described in Trace but
  never rendered as graph geometry.
- Final max-flow edges and endpoints use explicit green success emphasis.
- Final Min-Cut edges use `critical`; Result names both partitions and capacity.
- This spec updates `docs/analysis-visual-rules.md` for any flow-specific visual refinement.

## Acceptance scenarios

- All three maximum-flow definitions return the same value on a valid network.
- Parallel and zero-capacity edges respect stored capacities and never fabricate residual edges.
- Invalid capacity/direction or identical endpoints returns prominent `No result` without a footprint.
- Minimum Cut returns real cut edges and partitions whose capacity equals maximum flow.
