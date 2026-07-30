---
id: SPEC-005
item: ITEM-005
type: feat
feature_area: world
bump: minor
status: done
title: "Selection sync"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-005: Selection sync

## Problem

Manager and world selection can diverge without shared domain API usage.

## Goals

- Single selection source in graph/
- Bidirectional sync
- Clear selection

## Non-goals

- Multi-select (later)
- Edge selection unless cheap

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-005. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Selecting in manager highlights in world
- [ ] Selecting in world updates manager
- [ ] Clear selection works in both surfaces

## Data / domain

selection.ts APIs

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

- Re-render loops — careful subscriptions

## References

- Item: ITEM-005
- Related SPECs: SPEC-001, SPEC-004, SPEC-025
