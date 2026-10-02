---
id: SPEC-065
item: ITEM-073
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Negative-weight shortest path'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Negative-weight shortest path

- **Status:** Accepted

## Intent

Add Search-only Bellman–Ford for finite shortest paths containing negative weights.

## Scope

**In:** deterministic relaxation rounds, target-relevant negative-cycle detection, Analyze Result,
Trace/inspectors, shared reveal, tests. **Out:** all-pairs paths, cycle editing, arbitrary
precision, or changes to Dijkstra.

## Domain rules

- Relax every legal directed arc in stable graph order for at most `|V|-1` rounds; undirected
  edges contribute both legal directions.
- Stop after a round with no relaxation.
- A further relaxable node invalidates the query only if it is reachable from Start and can reach
  Target under legal directions. Result then says the shortest path is undefined due to a reachable
  negative cycle.
- A negative cycle unable to affect Target does not block a finite returned Target path.
- Start equal Target returns zero unless a target-affecting negative cycle makes its cost unbounded.

## Acceptance scenarios

- Given a path containing a negative edge but no relevant negative cycle, then Bellman–Ford returns
  its optimal finite cost and green path after orange exploration.
- Given a Start-reachable negative cycle that can reach Target, then Result prominently reports no
  finite shortest path and Trace identifies the detecting round.
- Given a reachable negative cycle that cannot reach Target, then it does not prevent a finite
  Start-to-Target result.
