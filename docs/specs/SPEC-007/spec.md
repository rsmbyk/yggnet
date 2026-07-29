---
id: SPEC-007
item: ITEM-007
type: feat
feature_area: directions
bump: minor
status: done
title: "Directions guided travel"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-007: Directions guided travel

## Problem

Selected paths cannot be traveled Google-Directions style.

## Goals

- Guided camera along selected path
- Compact route UI
- Exit to Explore

## Non-goals

- Algorithm step replay (ITEM-010)
- Follow-edge only hop (ITEM-008)

## Users & context

Mode focus: **Directions**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-007. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Start guided travel along selected path
- [ ] Compact route/steps UI while in Directions
- [ ] Exit returns to Explore bird's-eye

## Data / domain

session.directions selectedPathId

## Algorithms / traces (if any)

Uses path from SPEC-006

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

- Motion — keep speed sane; reduce-motion later

## References

- Item: ITEM-007
- Related SPECs: SPEC-003, SPEC-006, SPEC-008
