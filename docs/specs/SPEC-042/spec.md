---
id: SPEC-042
item: ITEM-042
type: feat
feature_area: world
bump: minor
status: in_review
title: "Solid nodes + pointer intents"
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-042: Solid nodes + pointer intents

## Problem

Nodes must behave as solid bodies with clear select/multi/move/connect pointer intents.

## Goals

- Kinematic collision; floor clamp; Alt snap; findFreePosition on add
- Click intents: select, sticky multi-select, Ctrl connect, Alt directed
- Move planes XZ / Ctrl XY / Shift YZ; RMB cancel move
- Esc / RMB cancel connect and clear multi where specified

## Non-goals

- Rigid-body physics simulation
- Touch multi-gesture

## Users & context

Mode focus: **World / Explore**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-042. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] node-physics prevents overlap and clamps to floor
- [x] node-click resolves select / multi / connect actions from modifiers
- [x] Connect banner shows while connecting; Esc/RMB cancels
- [x] Spawned nodes use WORLD.collision and WORLD.nodeRadius

## Data / domain

node-physics.ts; node-click.ts; WORLD.collision

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

node-physics.test.ts; node-click.test.ts

### Component / UI behavior

N/A

### Playwright (E2E)

world-intents.e2e.ts: add node; connect banner cancel with Escape

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-042
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
