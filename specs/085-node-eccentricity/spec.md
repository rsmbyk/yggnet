---
id: SPEC-085
item: ITEM-093
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Node eccentricity'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Node eccentricity

- **Status:** Accepted

## Intent

Show how far each node is from its most distant node using structural hop distance.

## Scope

**In:** fieldless Node Eccentricity; connected all-undirected graphs; exact unweighted distances;
generic Result, Trace, and Reveal; domain and Playwright coverage.

**Out:** weighted eccentricity, directed projection, disconnected/infinite values, custom panels.

## Domain rules

- Empty graphs, any directed edge, and disconnected graphs return prominent explanatory `No result`.
- Eccentricity is the maximum shortest-path edge count from a node to every other node. A
  single-node graph has eccentricity 0. Edge weights and positions are ignored.
- Parallel edges do not change hop distance; self-loops do not shorten a distance. Stored node and
  edge order breaks traversal ties.
- Return every node in stored order with its exact integer eccentricity. Normalized ranking values
  derive from the maximum eccentricity; when every exact value is 0, every normalized value is 0.

## Presentation rules

- Result uses a `ranking` artifact for normalized ring scale/color and a `table` artifact for exact
  hop values and stable accessible ordering.
- Reveal retains score-driven ranking rings. Trace exposes each BFS source, frontier, distances, and
  completed eccentricity; temporary work follows shared roles.
- No new visual role is introduced. Update `docs/analysis-visual-rules.md` with the metric semantics.

## Acceptance scenarios

### Scenario: Path graph values

**Given** the path A—B—C
**When** Node Eccentricity runs
**Then** exact values are A=2, B=1, C=2

### Scenario: Disconnected graph

**Given** at least two disconnected nodes
**When** analysis runs
**Then** prominent `No result` explains that finite whole-graph eccentricity requires connectivity
