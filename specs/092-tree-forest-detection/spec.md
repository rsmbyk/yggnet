---
id: SPEC-092
item: ITEM-100
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Tree and forest detection'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Tree and forest detection

- **Status:** Accepted

## Intent

Classify whether the complete graph is one tree, a disconnected forest, or contains a cycle.

## Scope

**In:** fieldless Tree/Forest Detection; all-undirected multigraphs; whole-graph classification;
component and cycle evidence; generic Result, Trace, and Reveal.

**Out:** directed arborescences, spanning-tree construction, repair suggestions, custom panels.

## Domain rules

- Empty graphs and any directed edge return prominent explanatory `No result`.
- A connected acyclic graph is `Tree`. A disconnected acyclic graph is `Forest`. Any graph with a
  cycle is `Neither`. A single isolated node is a Tree; multiple isolated nodes are a Forest.
- A self-loop is a cycle. Two parallel edges between distinct nodes form a length-2 cycle. Weights
  and positions are ignored. Component and traversal ordering follows stored node/edge order.

## Presentation rules

- Result reports classification, component count, node count, and edge count. Tree/Forest results
  return a component `partition`; a Neither result returns one deterministic real cycle `path` as
  evidence. Classification is a successful result, including `Neither`.
- Reveal colors Tree/Forest components with stable `component-N` roles. A Neither result retains the
  deterministic cycle using `critical`, not green success. Result text and legends carry meaning.
- Trace exposes DFS parent edges, component discovery, cycle checks, and the classification decision.
- Reuse existing roles and update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Isolated-node forest

**Given** several isolated nodes
**When** Tree/Forest Detection runs
**Then** Result classifies the graph as Forest and lists stable singleton components

### Scenario: Parallel-edge cycle

**Given** two nodes joined by two parallel undirected edges
**When** analysis runs
**Then** Result classifies the graph as Neither and retains that real two-edge cycle as critical
