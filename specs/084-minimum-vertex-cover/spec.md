---
id: SPEC-084
item: ITEM-092
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Minimum vertex cover analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Minimum vertex cover analysis

- **Status:** Accepted

## Intent

Identify one exact smallest node set that touches every stored edge.

## Scope

**In:** fieldless Minimum Vertex Cover; undirected graphs; exact deterministic set search; a
20-node limit; generic Result, Trace, and Reveal; domain and Playwright coverage.

**Out:** directed projection, weighted cover, enumeration, approximation, and custom panels.

## Domain rules

- Empty graphs return `No result`. Any directed edge is ineligible. Graphs above 20 nodes return
  prominent `No result` explaining the exact-search responsiveness limit.
- Each self-loop forces its incident node into every valid cover. Parallel edges impose the same
  endpoint constraint without changing the objective. Weights and positions are ignored.
- Search returns one smallest vertex cover. Equal-size optima use lexicographically earliest
  stored-node membership; this tie rule applies directly to the cover, not indirectly through a
  complementary independent-set tie.
- A nonempty edgeless graph successfully returns an empty cover. Every returned cover is verified
  against every real stored edge.

## Presentation rules

- Result returns a `node-set` artifact, exact size, covered-edge count, and accessible membership
  list, including a clear successful empty-cover summary.
- Trace exposes forced nodes, current cover, uncovered constraints, lower/upper bounds, pruning,
  and best updates.
- Candidate inspection is temporary; final cover members use persistent green result rings.
- No new visual role is introduced. Update `docs/analysis-visual-rules.md` for this algorithm.

## Acceptance scenarios

### Scenario: Self-loop forces its node

**Given** a node with a self-loop
**When** Minimum Vertex Cover runs
**Then** that node appears in the returned cover

### Scenario: Cover tie follows stored order

**Given** several minimum covers of equal size
**When** analysis runs
**Then** the lexicographically earliest cover membership is returned

### Scenario: Edgeless graph has an empty cover

**Given** one or more nodes and no edges
**When** Minimum Vertex Cover runs
**Then** Result succeeds with size zero and no persistent footprint
