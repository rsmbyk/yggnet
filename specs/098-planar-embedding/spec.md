---
id: SPEC-098
item: ITEM-106
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Planar Embedding analysis'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Planar Embedding analysis

- **Status:** Accepted

## Intent

Return a combinatorial embedding that gives the cyclic order of edges around every node in a planar
undirected graph.

## Scope

**In:** fieldless Planar Embedding definition; reuse of the Planarity Test core; rotation-system
artifact in generic Result; deterministic Trace.

**Out:** directed/mixed graphs, nonplanar embeddings, automatic node layout, saved-position changes,
and custom panels.

## Domain rules

- Empty graphs and graphs containing any directed edge return prominent explanatory `No result`.
- A nonplanar graph returns `No result` explaining that it has no planar embedding. Disconnected
  graphs are eligible and each component receives an embedding.
- Loops and parallel edges are supported as distinct stored incidences. Weights and saved positions
  do not affect planarity or the computed rotation order.
- The embedding is represented as a rotation system: for each node, list incident real edge IDs in
  clockwise cyclic order. Isolated nodes have an empty rotation. Node/edge traversal and orientation
  are deterministic from stored order.

## Presentation rules

- Result exposes one accessible table with a row per node and its clockwise edge-ID sequence, plus
  node/edge counts and a planar confirmation.
- Trace exposes the reused planarity search and embedding/rotation decisions.
- Analysis does not alter graph topology or positions and creates no persistent graph decoration.
  Update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Embedding a planar graph

**Given** a connected or disconnected undirected planar graph
**When** Planar Embedding runs
**Then** Result lists a deterministic cyclic order of all incident stored edges for every node

### Scenario: Nonplanar graph has no embedding

**Given** a subdivision of K5 or K3,3
**When** Planar Embedding runs
**Then** prominent `No result` explains that the graph is nonplanar
