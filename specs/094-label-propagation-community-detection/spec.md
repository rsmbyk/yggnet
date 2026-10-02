---
id: SPEC-094
item: ITEM-102
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Label Propagation community detection'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Label Propagation community detection

- **Status:** Accepted

## Intent

Find communities by propagating the labels supported by neighboring nodes.

## Scope

**In:** fieldless Label Propagation definition; deterministic weighted label updates; partition
Result; summarized round Trace; community Reveal.

**Out:** directed/mixed projection, negative weights, random ordering/seeds, tunable parameters, and
graph mutation.

## Domain rules

- Empty graphs and any directed edge return prominent explanatory `No result`.
- Every edge weight must be finite and nonnegative and is interpreted as vote strength. Parallel
  edges contribute separately. Isolated nodes remain singleton communities.
- Initialize each node with its own stable stored-order label. Update nodes asynchronously in stored
  node order; choose the label with greatest summed incident vote strength, retaining the current
  label on ties when it is among the tied labels, otherwise choose the earliest stored-order label.
- Stop after a full unchanged pass. A detected repeated assignment or a 1,000-pass guard stops the
  process deterministically and returns the encountered partition with highest weighted modularity;
  modularity ties use earliest stored node ordering. Result reports modularity and whether it
  converged or stopped on a cycle/guard.
- Weights and positions have no other meaning.

## Presentation rules

- Result lists community counts and members, number of update passes, and stop reason.
- Reveal persistently assigns stable component colors to the final partition; membership text
  remains accessible without color.
- Trace exposes each round's label changes, weighted votes/ties, and final stop decision.
- Update `docs/analysis-visual-rules.md`; no new visual role is introduced.

## Acceptance scenarios

### Scenario: Stable weighted label propagation

**Given** a connected undirected graph with an unambiguous majority label at each update
**When** Label Propagation runs
**Then** it returns the same partition and pass count for repeated runs

### Scenario: Unsupported direction is visible

**Given** a graph containing a directed edge
**When** Label Propagation runs
**Then** prominent `No result` explains that only undirected graphs are supported
