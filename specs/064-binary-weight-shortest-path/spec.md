---
id: SPEC-064
item: ITEM-072
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Binary-weight shortest path'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Binary-weight shortest path

- **Status:** Accepted

## Intent

Let Analyze run 0–1 BFS only where its binary-cost guarantee is true.

## Scope

**In:** Search-only 0–1 BFS, global binary-weight eligibility, deterministic deque Trace and
inspectors, shared Result/reveal behavior, and coverage.

**Out:** coercing weights, treating weight 0 as no edge, arbitrary weighted fallback, new renderer
or form surfaces, and configurable deque policy.

## Domain rules

- Every graph edge must have a finite weight exactly equal to 0 or 1; otherwise execution returns
  a prominent explanatory `No result` without a traversal footprint.
- Weight 0 remains a legal traversable edge.
- Directedness uses the graph's ordinary legal outgoing-edge semantics.
- Equal-cost choices follow existing stable graph order.
- Start equal to Target returns cost and length 0.
- A disconnected Target returns ordinary `No result` after the reachable footprint is explored.

## Acceptance scenarios

- Given binary-weight directed edges, when a zero-cost detour is cheaper than a direct one-cost
  edge, then Result returns the zero-cost route and cost 0.
- Given an edge weighted 2 or -1, when 0–1 BFS is run, then Result prominently explains it needs
  every edge to be weighted 0 or 1 and does not reinterpret or traverse that graph.
- Given a successful run, when Reveal completes, then explored objects remain orange and the
  optimal returned path replays green using only real graph edges.
