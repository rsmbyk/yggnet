---
id: SPEC-040
item: ITEM-040
type: feat
feature_area: world
bump: minor
status: done
title: "Canonical world config"
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-040: Canonical world config

## Problem

World scale lived behind a live Tune panel and drifted from docs/world-scale.md.

## Goals

- Single frozen WORLD object in world-config.ts
- docs/world-scale.md stays in sync with every WORLD key
- Remove World Tune UI and Vite save middleware
- Scene and session read WORLD directly

## Non-goals

- Reintroducing an in-app world editor
- Runtime hot-reload of config without rebuild

## Users & context

Mode focus: **World / Explore**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-040. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] WORLD.grid.textureSize is 250; groundSize is 10000
- [x] docs/world-scale.md matches WORLD (no World Tune references)
- [x] No world-tune panel/toggle; no /__yggnet/world-config writer plugin
- [x] defaultCameraPosition() matches WORLD.camera.defaultPosition math

## Data / domain

WORLD constant; defaultCameraPosition helper

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

world-config.test.ts locks textureSize, groundSize, camera helper, doc sync

### Component / UI behavior

N/A

### Playwright (E2E)

shell.e2e.ts asserts world-tune controls absent

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-040
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
