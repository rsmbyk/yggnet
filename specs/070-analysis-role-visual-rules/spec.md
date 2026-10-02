---
id: SPEC-070
item: ITEM-078
type: fix
feature_area: analyze
bump: patch
status: Accepted
title: 'Analysis role visual rules'
created: 2026-10-01
updated: 2026-10-01
---

# Spec: Analysis role visual rules

- **Status:** Accepted

## Intent

Make temporary analysis states unambiguous and prevent generic Reveal from becoming a green final result.

## Rules

- Current is cyan and solid/pulsing; Frontier is violet and wireframe; Inspecting is amber and pulses
  the real node/edge pair; Revisited is orange and double-ring; Settled is muted orange and static.
- Only explicit path emphasis uses green. Default `reveal-node` and `reveal-edge` resolve to Settled.
- Component roles retain their stable palette; Critical retains its warning treatment; landmarks render
  above every other decoration.
- Node and edge role colors share one semantic policy. Reduced motion retains static correct roles.

## Acceptance

- Generic traversal Reveal finishes orange unless it explicitly replays a successful path.
- Trace distinguishes current, frontier, inspect, revisit, and settled without color collisions.
- Component and critical results retain their existing semantic palette.
