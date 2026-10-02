---
id: SPEC-090
item: ITEM-098
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Graph density'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Graph density

- **Status:** Accepted

## Intent

Report how many possible distinct non-loop adjacencies are present.

## Scope

**In:** fieldless Graph Density; homogeneous directed or undirected graphs; exact simple-graph
formula inputs and scalar Result; summarized Trace.

**Out:** mixed-direction projection, weighted density, loop-inclusive pseudograph density, custom chart.

## Domain rules

- Empty graphs return `No result`. Mixed directed/undirected graphs return explanatory `No result`.
- Undirected density is `m / (n(n-1)/2)` using distinct unordered non-loop endpoint pairs. Directed
  density is `m / (n(n-1))` using distinct ordered non-loop endpoint pairs.
- Self-loops are excluded and parallel edges collapse to one adjacency. A one-node graph has density 0. The result is in `[0,1]`; weights and positions are ignored.

## Presentation rules

- Result reports density, node count, distinct adjacency count, possible adjacency count, direction
  kind, and formula text using existing scalar/table presentation.
- Density creates no persistent graph footprint. Trace shows normalization of each stored edge into
  an ignored loop, duplicate adjacency, or counted adjacency.
- No new visual role is introduced; update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Parallel edges do not inflate density

**Given** two undirected nodes joined by several parallel edges
**When** Graph Density runs
**Then** density is 1 using one distinct adjacency

### Scenario: Mixed direction is ineligible

**Given** both directed and undirected edges
**When** analysis runs
**Then** prominent `No result` explains that one density formula cannot represent the mix
