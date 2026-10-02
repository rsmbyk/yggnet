---
id: SPEC-077
item: ITEM-085
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Graph coloring analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Graph coloring analysis

- **Status:** Accepted

## Intent

Let users identify conflict-free node groups and determine whether a graph can be divided into two
such groups.

## Scope

**In:** fieldless Bipartite Check, Greedy Coloring, Welsh-Powell Coloring, and DSATUR Coloring;
deterministic color-class partitions; shared Result/Trace/Reveal presentation; accessible
color-class lists; domain, world/UI, and Playwright coverage.

**Out:** exact minimum coloring, user-selected color counts, edge coloring, graph edits, saved
comparison, and custom algorithm panels.

## Domain rules

- Every stored edge creates an undirected conflict between its endpoints; arrow direction and edge
  weight are irrelevant. Parallel edges do not add a second conflict.
- A self-loop makes proper node coloring impossible. All four algorithms return prominent
  `No result` explaining that a self-loop conflicts with its own node.
- Empty graphs return `No result`. An isolated node is a valid singleton color class.
- Bipartite Check colors all disconnected regions in stored node order using two classes. It returns
  `No result` for an odd cycle, naming that the graph is not bipartite.
- Greedy Coloring visits nodes in stored order and assigns the lowest available positive color index.
- Welsh-Powell orders nodes by descending conflict degree, breaking ties by stored node order, then
  repeatedly gives each compatible remaining node the current lowest color index.
- DSATUR repeatedly selects the uncolored node with the largest saturation degree; ties break by
  current conflict degree, then stored node order. It assigns the lowest available positive color
  index.
- Successful colorings emit a deterministic `partition` artifact labeled `Color 1`, `Color 2`, and
  so on. Bipartite Check also returns the same partition on success.

## Presentation rules

- Add a renderer-owned `color-N` persistent role using stable color-class palette slots. `Color 1`
  maps to slot 1 across all coloring algorithms; it is distinct from `component-N` semantics.
- Result lists every color class, its count, and members so hue is never the sole indicator.
- Trace exposes assigned colors, available/conflicting colors, and the next selected node. Reveal
  shows one node assignment at a time and retains its `color-N` role after completion.
- Start/End landmarks, explicit paths, component membership, and critical warnings retain their
  existing precedence from `docs/analysis-visual-rules.md`; this spec updates that document and
  renderer-policy tests with the new role.

## Acceptance scenarios

- Given a disconnected bipartite graph with isolated nodes, Bipartite Check succeeds with stable
  two-class membership and singleton handling.
- Given an odd cycle or self-loop, every coloring algorithm returns explanatory `No result` with no
  coloring decoration.
- Given directed and parallel edges, all coloring definitions use endpoint conflicts once and return
  deterministic class membership.
- Given a graph where stored-order Greedy uses more colors, Welsh-Powell and DSATUR may use fewer
  but retain their documented deterministic tie-breakers.
