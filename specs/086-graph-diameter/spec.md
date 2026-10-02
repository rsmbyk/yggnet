---
id: SPEC-086
item: ITEM-094
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Graph diameter'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Graph diameter

- **Status:** Accepted

## Intent

Report the greatest structural separation in a graph and show one route witnessing it.

## Scope

**In:** fieldless Graph Diameter; connected all-undirected graphs; unweighted hop distance; one
deterministic diametral shortest path; generic Result, Trace, and Reveal.

**Out:** weighted/directed diameter, infinite disconnected diameter, every diametral pair.

## Domain rules

- Empty graphs, any directed edge, and disconnected graphs return prominent explanatory `No result`.
- Diameter is the maximum node eccentricity. A single-node graph has diameter 0 and a one-node,
  zero-edge witness path. Weights and positions are ignored.
- Tied endpoint pairs use lexicographically earliest stored-node indices. Tied shortest witness
  paths use stored edge order. Parallel edges remain distinct and the first compatible edge wins.

## Presentation rules

- Result reports diameter, endpoint labels, and a real `path` artifact.
- Reveal replays only the witness's real nodes and edges in green, with Start/End landmarks above it.
- Trace summarizes source BFS runs, distance maxima, tied candidates, and witness reconstruction.
- No new visual role is introduced; update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Deterministic diametral path

**Given** several endpoint pairs at the diameter
**When** Graph Diameter runs
**Then** it returns the stored-order pair and stored-edge-order shortest witness

### Scenario: Disconnected graph

**Given** a disconnected undirected graph
**When** analysis runs
**Then** prominent `No result` explains that finite whole-graph diameter requires connectivity
