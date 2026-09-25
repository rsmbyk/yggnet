---
id: SPEC-041
item: ITEM-041
type: feat
feature_area: world
bump: minor
status: done
title: "Camera chrome + 2D/3D"
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-041: Camera chrome + 2D/3D

## Problem

Explore needs map chrome (reset target/orbit/zoom, minimap, readout) and a true top-down 2D mode with tweened transitions.

## Goals

- Camera controls: view-mode toggle, reset target/orbit/zoom, minimap, readout
- 2D mode: top-down XZ, orbit disabled, pan/move XZ-only
- 3D mode: free orbit; restore last 3D offset on leave-2D
- Tween duration from WORLD.controls.viewModeTransitionMs; reduced-motion instant

## Non-goals

- First-person fly camera
- Saved camera bookmarks

## Users & context

Mode focus: **World / Explore**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-041. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] camera-view-mode toggles between 2D and 3D
- [x] Reset target/orbit/zoom buttons animate using WORLD camera defaults
- [x] Minimap and camera readout remain visible with world
- [x] Cursor: grab on empty space; default on nodes

## Data / domain

app.ui.viewMode, last3dOrbit, viewModeEpoch; camera-fit helpers

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

camera-fit.test.ts; WORLD.controls.viewModeTransitionMs documented

### Component / UI behavior

N/A

### Playwright (E2E)

camera-view.e2e.ts: toggle 2D/3D and reset controls visible

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-041
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
