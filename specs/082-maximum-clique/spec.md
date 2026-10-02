---
id: SPEC-082
item: ITEM-090
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Maximum clique analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Maximum clique analysis

- **Status:** Accepted

## Intent

Identify one exact largest group whose distinct nodes are all pairwise adjacent.

## Scope

**In:** fieldless Maximum Clique; undirected graphs; exact deterministic bitset branch-and-bound;
shared exact-set search primitives; a 20-node limit; generic Result, Trace, and Reveal; tests.

**Out:** directed adjacency projection, weighted cliques, maximal-clique enumeration,
approximations, and custom panels.

## Domain rules

- Empty graphs return `No result`. Any directed edge makes the graph ineligible. Graphs above 20
  nodes return prominent `No result` explaining the exact-search responsiveness limit.
- Parallel edges collapse to one adjacency relation. Self-loops do not establish adjacency between
  distinct nodes and do not prevent their node joining a clique. Weights and positions are ignored.
- Search returns one largest clique. Equal-size optima are compared lexicographically by stored
  node order, selecting the earliest membership sequence.
- A nonempty edgeless graph returns the first stored node as a size-one maximum clique.

## Presentation rules

- Result returns a `node-set` artifact, exact size, and accessible membership list.
- Trace exposes current clique, candidates, upper bound, pruning, and best-so-far updates.
- Candidate inspection is temporary; final clique nodes use persistent green result rings.
- No new visual role is introduced. Update `docs/analysis-visual-rules.md` with exact-set semantics.

## Acceptance scenarios

### Scenario: Tied maximum cliques

**Given** multiple largest cliques of equal size
**When** Maximum Clique runs
**Then** the lexicographically earliest membership by stored node order is returned

### Scenario: Direction is not silently projected

**Given** a directed or mixed graph
**When** Maximum Clique runs
**Then** prominent `No result` explains that the analysis requires undirected edges

### Scenario: Exact-search limit is visible

**Given** 21 nodes
**When** Maximum Clique runs
**Then** `No result` states the 20-node exact-search limit
