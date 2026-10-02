---
id: SPEC-066
item: ITEM-074
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Acyclic shortest path'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Acyclic shortest path

- **Status:** Accepted

## Intent

Add Search-only DAG shortest path for eligible directed acyclic graphs.

## Scope

**In:** directed-DAG validation, stable topological sort and single-pass relaxation, negative
weights, Analyze integration and tests. **Out:** automatic cycle breaking, treating undirected
edges as directed, all-pairs paths, or topological-sort tool mode.

## Domain rules

- Every stored edge must be directed. Any undirected edge produces explanatory `No result` before
  traversal because it represents two-way connectivity rather than a DAG arc.
- Kahn's topological sort uses stable graph order for zero-in-degree ties.
- If fewer than all nodes are ordered, Result says the graph contains a directed cycle and no DAG
  shortest-path run occurs.
- One deterministic pass relaxes legal outgoing arcs in topological order; weights may be negative.
- Start equal Target has zero cost; unreachable Target gives ordinary `No result`.

## Acceptance scenarios

- Given an eligible directed DAG with a negative edge, then the returned finite path has the
  minimum cost and is shown as green after orange exploration.
- Given a directed cycle, then the Result prominently states that DAG shortest path requires an
  acyclic directed graph.
- Given an undirected edge, then it is rejected rather than silently oriented or duplicated.
