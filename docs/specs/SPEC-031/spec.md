---
id: SPEC-031
item: ITEM-031
type: feat
feature_area: world
bump: patch
status: done
title: "Directed edge visuals in world"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-031: Directed edge visuals in world

## Problem

Directed flag is editable in the manager and stored on edges, but the world still draws plain cylinders with no direction cue.

## Goals

- Clear direction cue on directed edges in Threlte
- Undirected edges stay plain
- Stay within the technical visual language

## Non-goals

- Cartographic or sci-fi skins (parked)
- Changing directed semantics in pathfinding

## Users & context

Mode focus: **Explore world**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-002, SPEC-004).

## Behavior & UX

Implements ITEM-031. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Directed edges render with a clear direction cue (arrow or equivalent) in the world
- [ ] Undirected edges remain plain (no arrow)
- [ ] Direction cue updates when the directed flag is toggled
- [ ] Cue respects current path/algo overlays without becoming unreadable
- [ ] No new skin system; stay within the technical visual language

## Data / domain

Read GraphEdge.directed; no schema change expected

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Arrow clutter on dense graphs — keep cue small

## References

- Item: ITEM-031
- Related SPECs: SPEC-002, SPEC-004
- Prior SPECs: SPEC-002, SPEC-004
