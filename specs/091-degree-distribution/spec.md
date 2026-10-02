---
id: SPEC-091
item: ITEM-099
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Degree distribution'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Degree distribution

- **Status:** Accepted

## Intent

Show how many nodes have each degree, including isolated nodes and multigraph multiplicity.

## Scope

**In:** fieldless Degree Distribution; homogeneous directed or undirected graphs; exact frequency
tables; generic Result and summarized Trace.

**Out:** mixed-direction projection, probability plots, fitted distributions, custom charts.

## Domain rules

- Empty graphs return `No result`. Mixed directed/undirected graphs return explanatory `No result`.
- Undirected graphs return one degree distribution. Each ordinary edge contributes 1 at each
  endpoint, each self-loop contributes 2, and parallel edges count separately.
- Directed graphs return separate in-degree, out-degree, and total-degree distributions. Each
  self-loop contributes 1 in and 1 out; parallel arcs count separately.
- Every integer bucket from 0 through the observed maximum is returned, including zero-count gaps.
  Counts sum to node count. Weights and positions are ignored.

## Presentation rules

- Result uses existing `table` artifacts with Degree and Node count columns, plus node/edge totals
  and direction kind. No custom chart or persistent graph footprint is introduced.
- Trace shows per-edge degree increments and final bucket construction.
- Update `docs/analysis-visual-rules.md` to document the textual/no-footprint result.

## Acceptance scenarios

### Scenario: Isolated nodes are included

**Given** an undirected graph with two isolated nodes and one connected pair
**When** Degree Distribution runs
**Then** the degree-0 bucket contains two nodes and the degree-1 bucket contains two nodes

### Scenario: Directed distributions

**Given** a homogeneous directed graph
**When** analysis runs
**Then** Result separately lists exact in, out, and total frequency tables
