---
id: SPEC-019
item: ITEM-019
type: feat
feature_area: world
bump: patch
status: done
title: "LOD labels"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-019: LOD labels

## Problem

Labels are not LOD-aware for overview vs street.

## Goals

- Hide/minimize labels at overview
- Show at street zoom

## Non-goals

- Full typographic system

## Users & context

Mode focus: **Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-019. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Labels hidden or minimal at overview
- [ ] Labels readable at street-level zoom

## Data / domain

N/A camera distance

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

- Flicker at threshold — hysteresis

## References

- Item: ITEM-019
- Related SPECs: SPEC-003, SPEC-004
