---
id: SPEC-039
item: ITEM-039
type: feat
feature_area: world
bump: minor
status: done
title: "World-first shell + HUD"
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-039: World-first shell + HUD

## Problem

Manager chrome dominated the first viewport; the 3D world needs to be the primary shell with a floating HUD.

## Goals

- Full-bleed 3D world as the primary UI surface
- Floating World HUD menubar: brand, undo/redo, add node, command palette
- Viewport-too-small overlay when chrome cannot fit
- No permanent admin sidebar; no World Tune entry in the HUD

## Non-goals

- Live world-config editor
- Cloud sync

## Users & context

Mode focus: **World / Explore**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-039. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] Shell shows full-bleed world (`yggnet-world`) with floating HUD (`world-hud`)
- [x] HUD exposes brand, undo, redo, add-node, and palette trigger
- [x] World Tune toggle and panel are absent
- [x] Too-small viewport shows blocking overlay with recovery when resized

## Data / domain

N/A — session/UI shell

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

hud-layout unit tests remain green

### Component / UI behavior

N/A

### Playwright (E2E)

shell.e2e.ts: world + HUD visible; world-tune controls absent; too-small overlay

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-039
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
