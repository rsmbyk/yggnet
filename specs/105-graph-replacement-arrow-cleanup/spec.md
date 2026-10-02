---
id: SPEC-105
item: ITEM-113
type: fix
feature_area: world
bump: patch
status: Accepted
title: 'Clear stale direction cones when replacing a graph'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Clear stale direction cones when replacing a graph

- **Status:** Accepted

## Intent

Prevent direction-cone visuals from a previous graph remaining in the world after the active graph
is replaced or regenerated.

## Scope

**In:** lifecycle of direction-cone/arrowhead visuals derived from graph edges; replacement between
directed and undirected graphs; regression coverage.

**Out:** arrow geometry/style changes, graph model changes, or changes to valid current-graph edges.

## Rules

- Direction cones visible in the world correspond only to directed edges in the current graph.
- Replacing the graph removes arrowhead visuals belonging to the prior graph.
- Replacing a directed graph with an undirected graph leaves no direction cones.
- Replacing a graph with another directed graph shows only the cones corresponding to its directed
  edges; no old positions or endpoints persist.
- Existing direction indicators for valid edges in the current graph retain their current geometry
  and appearance.

## Acceptance scenarios

### Scenario: Replace a directed graph with an undirected graph

**Given** a directed graph with visible direction cones
**When** the user generates or opens a different graph with no directed edges
**Then** no cones from the previous graph remain visible.

### Scenario: Replace one directed graph with another

**Given** a directed graph with a known set of direction cones
**When** it is replaced by a different directed graph
**Then** the visible cones correspond exactly to directed edges in the new graph.

### Scenario: Preserve current graph indicators

**Given** the active graph contains directed and undirected edges
**When** its world rendering is updated
**Then** valid direction indicators remain attached only to its directed edges with unchanged geometry.

## Traceability

- Domain/app tests: GraphScene/world graph replacement lifecycle tests.
- E2E: `e2e/generate-form.e2e.ts`.
- Implementation: pending Draft acceptance.
