---
id: SPEC-043
item: ITEM-043
type: feat
feature_area: world
bump: minor
status: done
title: "Labels, colors, edge geometry"
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-043: Labels, colors, edge geometry

## Problem

Node presence needs LOD labels, distinct idle/selected/hover colors, and consistent edge/arrow geometry from WORLD.

## Goals

- Billboard labels with LOD by WORLD.labelDistance
- Idle / selected / hover colors from WORLD
- Edge shaft + directed arrow from WORLD.edges

## Non-goals

- Custom per-node materials UI
- SDF text atlas

## Users & context

Mode focus: **World / Explore**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-043. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] WORLD.nodeColor / nodeSelectedColor / nodeHoverColor are the scene palette
- [x] WORLD.labelDistance is 50
- [x] edge-pose uses WORLD.edges dimensions for shaft and arrow placement

## Data / domain

WORLD colors, labelDistance, edges; edge-pose.ts; node-sphere.ts

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

world-config asserts colors/distances; edge-pose.test.ts; node-sphere.test.ts

### Component / UI behavior

N/A

### Playwright (E2E)

Covered indirectly via world smoke; no dedicated visual regression

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-043
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
