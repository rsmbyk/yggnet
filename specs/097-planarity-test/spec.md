---
id: SPEC-097
item: ITEM-105
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Planarity Test'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Planarity Test

- **Status:** Accepted

## Intent

Determine whether a graph can be drawn in the plane with no edge crossings.

## Scope

**In:** fieldless whole-graph planarity classification for undirected graphs; deterministic Result
and Trace; loops and parallel-edge semantics.

**Out:** directed graph projection, automatic layout, graph mutation, and custom visualization.

## Domain rules

- Empty graphs return prominent explanatory `No result`. Any directed edge returns `No result`
  because this module analyzes undirected graphs only.
- Disconnected undirected graphs are eligible. Self-loops and parallel edges do not change
  planarity; the test may reduce to a simple graph while Result still reports stored graph counts.
- Use a linear-time left-right planarity test or equivalent bounded polynomial algorithm. Stable
  node and edge ordering determines traversal and Trace order.
- Both planar and nonplanar are successful classifications, not `No result`. Weights and positions
  are ignored.

## Presentation rules

- Result clearly states Planar or Nonplanar, with node/edge counts and a short explanation.
- Trace exposes DFS orientation, low-point updates, pertinent-root/stack decisions, and final
  classification. Trace truncation does not affect classification.
- No persistent graph footprint or graph mutation is introduced. Update
  `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Planar and nonplanar classifications

**Given** one planar graph and one subdivision of K5 or K3,3
**When** the Planarity Test runs on each
**Then** Result classifies the first Planar and the second Nonplanar

### Scenario: Direction is rejected

**Given** a graph containing a directed edge
**When** the Planarity Test runs
**Then** prominent `No result` explains the undirected-only requirement
