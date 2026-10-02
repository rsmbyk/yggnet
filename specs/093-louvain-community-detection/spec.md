---
id: SPEC-093
item: ITEM-101
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Louvain community detection'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Louvain community detection

- **Status:** Accepted

## Intent

Identify densely connected communities within an undirected weighted graph using modularity
optimization.

## Scope

**In:** fieldless Louvain definition; deterministic multilevel modularity optimization; component
partition Result; modularity metric; summarized Trace and community Reveal.

**Out:** directed/mixed projection, negative strength, user-selected resolution, stochastic seeds,
and graph mutation.

## Domain rules

- Empty graphs and graphs containing any directed edge return prominent explanatory `No result`.
- Every stored edge weight must be finite and nonnegative. Weights represent connection strength;
  omitted/default edge weights use the graph model's stored default. Parallel edges add strength.
- Self-loops contribute to modularity as internal strength. Isolated nodes are singleton communities.
- If the total edge strength is zero, return one singleton community per node with modularity 0.
- Use standard resolution 1.0. Node scan order follows stored node order; modularity ties retain the
  earliest stored-order candidate; community labels follow the smallest stored node position in
  each community. Deterministic aggregation follows stored edge order.
- Return one partition when optimization reaches a local optimum. A fixed bounded pass/level guard
  prevents pathological work; hitting the guard returns the best modularity partition found and
  reports that optimization stopped at the guard.

## Presentation rules

- Result lists modularity, community count, node count, and each numbered community's members/count.
- Reveal persistently colors each partition using the shared stable component palette. Text labels
  and membership lists remain the non-color meaning.
- Trace records local node moves, modularity change, aggregation levels, and the retained partition;
  the event cap never changes the computed Result.
- Update `docs/analysis-visual-rules.md` with partition role behavior and weight semantics.

## Acceptance scenarios

### Scenario: Weighted groups in one connected graph

**Given** two dense undirected groups joined by a weaker edge
**When** Louvain runs
**Then** Result returns a deterministic partition and modularity score using edge weights as strength

### Scenario: Negative weights are rejected

**Given** an undirected graph with a negative edge weight
**When** Louvain runs
**Then** prominent `No result` explains that strengths must be nonnegative
