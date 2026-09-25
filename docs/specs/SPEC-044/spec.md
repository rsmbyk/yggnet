---
id: SPEC-044
item: ITEM-044
type: feat
feature_area: world
bump: minor
status: done
title: "In-world selection sheet + create"
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-044: In-world selection sheet + create

## Problem

Selected nodes/edges need an in-world inspector; create/connect/delete must work without opening Manager.

## Goals

- Bottom-left selection sheet for selected node/edge
- HUD add-node near camera look-target
- Connect mode from selection; Del/Backspace deletes selection
- Esc cancels connect / clears as specified

## Non-goals

- Full property editor parity with Manager companion
- Multi-window inspectors

## Users & context

Mode focus: **World / Explore**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-044. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] Selecting a node shows the in-world selection sheet
- [x] world-add-node creates a node near the view target
- [x] Delete selection removes selected nodes/edges
- [x] Connect banner + cancel path works from world

## Data / domain

app selection + connectFromId; WorldHud / selection sheet markup

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

scene-reveal / selection domain tests remain green

### Component / UI behavior

N/A

### Playwright (E2E)

world-selection.e2e.ts: add node from HUD; selection sheet appears

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-044
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
