---
id: SPEC-083
item: ITEM-091
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Maximum independent set analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Maximum independent set analysis

- **Status:** Accepted

## Intent

Identify one exact largest group whose nodes share no stored edge with one another.

## Scope

**In:** fieldless Maximum Independent Set; undirected graphs; exact deterministic set search; a
20-node limit; generic Result, Trace, and Reveal; domain and Playwright coverage.

**Out:** directed projection, weighted independent sets, enumeration, approximation, and custom panels.

## Domain rules

- Empty graphs return `No result`. Any directed edge is ineligible. Graphs above 20 nodes return
  prominent `No result` explaining the exact-search responsiveness limit.
- Parallel edges collapse to one adjacency constraint. A self-loop prevents its node from joining
  an independent set. Weights and positions are ignored.
- Search returns one largest independent set. Equal-size optima use lexicographically earliest
  stored-node membership.
- A nonempty edgeless graph with no self-loops returns every node. A graph where every node has a
  self-loop successfully returns an empty independent set.

## Presentation rules

- Result returns a `node-set` artifact, exact size, and accessible membership list, including a
  clear successful empty-set summary.
- Trace exposes included nodes, remaining candidates, upper bound, pruning, and best updates.
- Candidate inspection is temporary; final members use persistent green result rings.
- No new visual role is introduced. Update `docs/analysis-visual-rules.md` for this algorithm.

## Acceptance scenarios

### Scenario: Self-loops constrain membership

**Given** an otherwise isolated node with a self-loop
**When** Maximum Independent Set runs
**Then** that node is excluded from every candidate and the final result

### Scenario: Tied optima are stable

**Given** several largest independent sets
**When** analysis runs repeatedly
**Then** it returns the lexicographically earliest stored-node membership each time

### Scenario: Empty optimum is successful

**Given** a nonempty graph in which every node has a self-loop
**When** analysis runs
**Then** Result reports a successful independent set of size zero rather than `No result`
