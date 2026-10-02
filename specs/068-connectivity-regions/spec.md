---
id: SPEC-068
item: ITEM-076
type: feat
feature_area: analyze
bump: minor
status: Accepted
title: 'Connectivity region analysis'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Connectivity region analysis

- **Status:** Accepted

## Intent

Let users inspect every full-graph connectivity region through standard component semantics.

## Scope

**In:** fieldless connected/weak/strong component definitions; deterministic `partition` artifacts;
shared Result/Trace/Reveal; stable accessible component palette; domain/world/UI/E2E coverage.

**Out:** bridges, articulation points, directed criticality, graph edits, saved comparison, and custom
algorithm panels.

## Domain rules

- Empty graph returns prominent `No result` and no footprint.
- Connected Components requires all edges undirected; any directed edge returns explanatory
  `No result` before traversal.
- Weakly Connected Components ignores every arrow direction.
- Strongly Connected Components follows directed arcs and treats each undirected edge as two arcs.
- Components, their node membership, and traversal ties follow stored graph order. Every isolated
  node is a singleton component.
- Result emits a `partition` whose labels are `Component 1`, `Component 2`, and so on, ordered by
  first encountered node.

## Presentation rules

- Generic Reveal visits one component at a time and retains its component role afterward.
- The world maps each component role to a stable distinct accessible color. Result lists every
  numbered component and node count, so colors are not the sole indicator.
- Graph structure remains untouched; decorations are temporary analysis state.

## Acceptance scenarios

- Given disconnected undirected regions and isolated nodes, Connected Components returns every
  deterministic region including singleton components.
- Given one-way edges, Weak Components groups physically linked nodes while Strong Components keeps
  nodes separate unless each can reach the other.
- Given a directed edge, Connected Components returns `No result` explaining the undirected-only
  requirement without component colors.
