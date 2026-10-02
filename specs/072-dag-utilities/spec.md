---
id: SPEC-072
item: ITEM-080
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'DAG utilities'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: DAG utilities

## Rules

- Topological Sort and Directed Cycle Detection are fieldless and require every edge to be directed.
- Topological Sort uses stable Kahn ordering; empty/undirected/cyclic graphs return explanatory
  `No result`, while disconnected DAGs are valid.
- Cycle Detection uses strongly connected components. Every non-singleton SCC is cyclic; a singleton
  is cyclic only with a self-loop. It returns all nodes and internal edges in cyclic SCCs.
- Cycle-free directed graphs return complete success with an empty finding set and `No directed cycles found`.
- Cyclic findings persist in the shared critical treatment; weights are ignored.
