---
id: SPEC-067
item: ITEM-075
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Informed point-to-point shortest paths'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Informed point-to-point shortest paths

- **Status:** Accepted

## Intent

Add optimal A* and Bidirectional Dijkstra searches for non-negative weighted graphs.

## Scope

**In:** Search-only A*, Bidirectional Dijkstra, non-negative validation, safe A* helper copy,
priority-frontier Trace/inspectors, shared Result/reveal, tests. **Out:** custom heuristics,
greedy/beam search, negative-weight fallback, all-pairs paths, or renderer-specific algorithm UI.

## Domain rules

- Both algorithms require every traversable edge weight to be finite and non-negative; an eligible
  query encountering a negative edge returns explanatory `No result` rather than a misleading path.
- A* computes `h(node) = scale × EuclideanDistance(node, Target)`, with `scale` the minimum finite
  `edgeWeight / EuclideanEdgeLength` over all non-negative, nonzero-length graph edges. If no
  usable scale exists, it uses `0`.
- The helper text says: “Uses a safely scaled straight-line estimate. It never overestimates the
  remaining cost, so the path stays optimal; when no safe scale is available, it uses zero and
  behaves like Dijkstra.”
- A* deterministic ties use existing graph order and returns optimal cost/path.
- Bidirectional Dijkstra expands from Start over outgoing arcs and from Target over incoming arcs;
  it stops only when its minimum-frontier bound cannot beat the best meeting cost.
- Both return length, cost, explored count, and their serializable frontier/distance/predecessor
  state. Successful Reveal remains orange for exploration then green for the returned path.

## Acceptance scenarios

- Given arbitrary non-negative weights whose geometry is not measured in weight units, when A*
  runs, then its helper explains its safe scaled heuristic and Result still matches Dijkstra's
  optimal cost; if no scale is usable, it safely runs with heuristic zero.
- Given a negative edge in the legal query graph, when either informed algorithm runs, then no
  potentially incorrect route is shown and Result explains the non-negative requirement.
- Given a directed graph, when Bidirectional Dijkstra searches, then its target-side expansion uses
  incoming arcs and its joined route respects every stored edge direction.
