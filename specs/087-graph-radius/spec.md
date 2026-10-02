---
id: SPEC-087
item: ITEM-095
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Graph radius'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Graph radius

- **Status:** Accepted

## Intent

Report the smallest maximum hop distance achievable from any node.

## Scope

**In:** fieldless Graph Radius; connected all-undirected graphs; exact unweighted scalar; generic
Result and summarized Trace.

**Out:** weighted/directed radius, infinite disconnected values, custom visualization.

## Domain rules

- Empty graphs, any directed edge, and disconnected graphs return prominent explanatory `No result`.
- Radius is the minimum node eccentricity. A single-node graph has radius 0. Parallel edges and
  self-loops do not change distances; weights and positions are ignored.

## Presentation rules

- Result reports the exact integer radius and node count. It creates no persistent graph footprint;
  Graph Center owns center membership visualization.
- Trace summarizes each node's completed eccentricity and the current minimum.
- No new visual role is introduced; update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Path radius

**Given** the path A—B—C
**When** Graph Radius runs
**Then** Result reports radius 1

### Scenario: No fabricated decoration

**Given** any eligible graph
**When** Result completes
**Then** it shows the scalar without persistent node or edge decoration
