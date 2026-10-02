---
id: SPEC-095
item: ITEM-103
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Traveling Salesman analysis'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Traveling Salesman analysis

- **Status:** Accepted

## Intent

Find one exact minimum-cost closed tour that visits every node exactly once.

## Scope

**In:** fieldless Traveling Salesman definition; directed or undirected homogeneous graphs; bounded
Held–Karp DP; deterministic route/cost Result, Trace, and Reveal.

**Out:** open tours, approximate/heuristic fallback, mixed-direction projection, and graph mutation.

## Domain rules

- Empty graphs and graphs above 20 nodes return prominent explanatory `No result`.
- All edges must have the same direction type. Every edge weight must be finite and is interpreted
  as route cost; negative, zero, and positive finite costs are allowed because every tour has a
  fixed number of transitions. Weights do not change eligibility beyond finiteness.
- Use Held–Karp bitmask dynamic programming. Stored node order breaks equal-cost route ties; among
  parallel transitions choose minimum cost, then earliest stored edge. Self-loops are ignored for
  tours of two or more nodes. A one-node tour requires a stored self-loop.
- A two-node undirected circuit requires two distinct stored edges; a directed circuit requires one
  arc in each direction. No edge may be reused within the returned circuit.
- Unsatisfiable graphs return `No result` without graph decoration. Exact result is unaffected by
  Trace truncation.

## Presentation rules

- Result reports exact total cost, node count, edge count, and a closed real-edge path artifact.
- Trace exposes DP states, candidate transitions, retained parents, and reconstruction decisions.
- Reveal replays the final circuit in green; exploratory candidates stay temporary.
- Update `docs/analysis-visual-rules.md`; reuse the existing path palette.

## Acceptance scenarios

### Scenario: Minimum of competing tours

**Given** a weighted graph with multiple Hamiltonian circuits
**When** Traveling Salesman runs
**Then** it returns the least-cost deterministic circuit using only stored edges

### Scenario: Exact search cap

**Given** a graph with 21 nodes
**When** Traveling Salesman runs
**Then** prominent `No result` explains the 20-node exact-search limit
