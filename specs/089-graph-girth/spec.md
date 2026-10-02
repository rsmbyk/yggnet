---
id: SPEC-089
item: ITEM-097
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Graph girth'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Graph girth

- **Status:** Accepted

## Intent

Report the length of the graph's shortest cycle and show one cycle witnessing it.

## Scope

**In:** fieldless Graph Girth; all-undirected graphs; disconnected regions; multigraph cycles;
deterministic shortest-cycle witness; generic Result, Trace, and Reveal.

**Out:** directed girth, weighted cycle length, every shortest cycle, custom panels.

## Domain rules

- Empty graphs and any directed edge return prominent explanatory `No result`.
- Girth is the number of stored edges in the shortest cycle across all components. A self-loop has
  girth 1; two parallel edges between distinct nodes form a length-2 cycle.
- A nonempty acyclic graph returns prominent `No result` explaining that girth is undefined because
  no cycle exists. Isolated nodes do not otherwise affect eligibility.
- Equal-length cycles use earliest stored edge sequence, then stored node order. Weights and
  positions are ignored, and the witness uses only real stored edge IDs.

## Presentation rules

- Result reports girth and returns a closed `path` artifact with repeated start and exact edges.
- Reveal replays the real witness cycle in green. Trace exposes each BFS root, candidate closing
  edge, candidate length, and retained shortest cycle; exploration remains temporary.
- No new visual role is introduced; update `docs/analysis-visual-rules.md`.

## Acceptance scenarios

### Scenario: Multigraph cycles

**Given** both a self-loop and a parallel-edge cycle
**When** Graph Girth runs
**Then** the self-loop is returned with girth 1

### Scenario: Forest has no girth

**Given** a nonempty acyclic graph
**When** analysis runs
**Then** prominent `No result` explains that no cycle exists
