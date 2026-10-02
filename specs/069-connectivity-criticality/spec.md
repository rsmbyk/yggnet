---
id: SPEC-069
item: ITEM-077
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Connectivity criticality analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Connectivity criticality analysis

- **Status:** Accepted

## Intent

Expose bridges and articulation points without changing the graph.

## Scope

**In:** fieldless Bridges and Articulation Points definitions; undirected eligibility; deterministic
Tarjan DFS; existing node/edge-set artifacts; shared warning presentation; domain/world/UI/E2E tests.

**Out:** directed strong bridges/articulation points, automated graph repair, weights, and custom UI.

## Domain rules

- Empty graph returns prominent `No result` and no footprint.
- Each definition requires every edge to be undirected; a directed or mixed graph returns explanatory
  `No result` before traversal.
- DFS roots, neighbors, findings, and artifact order follow stored graph order.
- A bridge is an edge whose removal increases connected-component count. Parallel edges prevent each
  other from being bridges; self-loops are never bridges.
- An articulation point is a node whose removal increases connected-component count. Root and
  non-root low-link conditions use standard Tarjan rules; self-loops do not create a cut node.
- Disconnected graphs are analyzed component by component.

## Presentation rules

- Trace exposes DFS stack, discovery order, low-link values, parent edges, and findings.
- Result retains bridges/cut nodes in a dedicated renderer-owned warning role, with a legend and
  explicit Result lists; color is not the only meaning.
- Reveal only references stored node IDs and edge IDs.

## Acceptance scenarios

- Given a cycle with a tail, Bridges returns only the tail edge and Articulation Points returns its
  separating node.
- Given parallel edges and self-loops, neither algorithm reports a false bridge or cut node.
- Given a graph containing a directed edge, both definitions return `No result` explaining their
  undirected-only requirement and leave no warning footprint.
