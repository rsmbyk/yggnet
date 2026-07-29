---
id: SPEC-020
item: ITEM-020
type: feat
feature_area: world
bump: minor
status: done
title: "Minimap"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-020: Minimap

## Problem

No minimap radar for orientation in large graphs.

## Goals

- Minimap extent + viewport
- Click/drag to pan

## Non-goals

- Minimap editing

## Users & context

Mode focus: **Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-020. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Minimap shows graph extent and viewport
- [ ] Click/drag on minimap pans main camera

## Data / domain

N/A

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

- Perf — simplify geometry

## References

- Item: ITEM-020
- Related SPECs: SPEC-003, SPEC-004
