---
id: SPEC-004
item: ITEM-004
type: feat
feature_area: world
bump: minor
status: done
title: "World graph render"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-004: World graph render

## Problem

GraphDocument is not rendered as nodes/edges in the Threlte world.

## Goals

- Render nodes and edges from document
- Technical visual language
- Update on document change

## Non-goals

- Path highlight overlays (ITEM-006)
- LOD labels (ITEM-019)
- Live floating motion (parked)

## Users & context

Mode focus: **Explore world**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-004. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Nodes and edges visible in the 3D world from document data
- [ ] Layout uses node positions (auto later OK)
- [ ] Visual style stays clean/technical

## Data / domain

Read GraphDocument positions/labels

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

- Perf for large graphs — start simple

## References

- Item: ITEM-004
- Related SPECs: SPEC-001, SPEC-003, SPEC-005, SPEC-006
