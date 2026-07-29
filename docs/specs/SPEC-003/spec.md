---
id: SPEC-003
item: ITEM-003
type: feat
feature_area: explore
bump: minor
status: ready
title: "Explore bird's-eye camera"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-003: Explore bird's-eye camera

## Problem

World camera is a static placeholder; Explore needs RTS/SimCity bird's-eye navigation.

## Goals

- Pan, zoom, light orbit
- Overview vs street altitude
- Keep bird's-eye (not FPS)

## Non-goals

- Directions travel (ITEM-007)
- Minimap (ITEM-020)

## Users & context

Mode focus: **Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-003. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Pan and zoom the overlook camera
- [ ] Limited tilt/orbit without leaving bird's-eye feel
- [ ] Toggle or gesture for overview vs street-level framing

## Data / domain

Session mode explore; camera state in session/world only

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Optional camera bookmark later — out of scope

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Orbit too free becomes FPS-like — clamp tilt

## References

- Item: ITEM-003
- Related SPECs: SPEC-004, SPEC-007, SPEC-019, SPEC-020
