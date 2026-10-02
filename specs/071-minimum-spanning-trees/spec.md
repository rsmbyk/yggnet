---
id: SPEC-071
item: ITEM-079
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Minimum spanning trees'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Minimum spanning trees

## Intent

Add Kruskal and Prim MST analyses without silently changing graph direction semantics.

## Rules

- Both definitions are fieldless and require a non-empty, connected graph whose every edge is undirected.
- Empty, disconnected, or directed/mixed graphs return prominent explanatory `No result` with no final tree.
- Finite negative, zero, and positive weights are valid. Equal weights use stored edge order.
- A single-node graph returns an empty tree with cost 0 and edge count 0.
- Kruskal exposes sorted candidates, disjoint sets, accepted edges, and cycle rejections. Prim exposes
  its tree, frontier candidates, selected edge, and rejections.
- Result returns a tree artifact, total weight, and edge count. Only selected tree edges/nodes persist
  green; inspected or rejected work is temporary shared-role decoration.

## Acceptance

- Given a connected weighted graph, Kruskal and Prim return the same minimum total cost.
- Given tied candidate edges, both produce their deterministic stored-order result.
- Given directed/mixed or disconnected input, Result explains why no spanning tree is available.
