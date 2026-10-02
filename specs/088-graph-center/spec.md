---
id: SPEC-088
item: ITEM-096
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Graph center'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Graph center

- **Status:** Accepted

## Intent

Identify every node minimizing the greatest hop distance to the rest of the graph.

## Scope

**In:** fieldless Graph Center; connected all-undirected graphs; exact unweighted center membership;
generic node-set Result, Trace, and Reveal.

**Out:** weighted/directed centers, disconnected component centers, enumeration beyond the full set.

## Domain rules

- Empty graphs, any directed edge, and disconnected graphs return prominent explanatory `No result`.
- The center contains every node whose eccentricity equals the radius. A single-node graph returns
  that node. Output follows stored node order; weights and positions are ignored.

## Presentation rules

- Result returns a `node-set` artifact, exact radius, center count, and accessible membership list.
- Reveal emphasizes every center node with persistent green result rings. Trace exposes completed
  eccentricities, radius selection, and membership decisions.
- No new visual role is introduced; update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Multiple centers

**Given** a four-node path
**When** Graph Center runs
**Then** both middle nodes are returned in stored order

### Scenario: Center rings

**Given** an eligible graph
**When** Reveal completes
**Then** every listed center and only those centers retain green result rings
