---
id: SPEC-008
item: ITEM-008
type: feat
feature_area: directions
bump: patch
status: ready
title: "Follow edge"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-008: Follow edge

## Problem

No one-hop follow along a single edge.

## Goals

- From selected node follow chosen edge to neighbor
- Same travel language as Directions

## Non-goals

- Full A→B pathfinder

## Users & context

Mode focus: **Explore/Directions**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-008. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] From a selected node, choose an edge and travel to neighbor
- [ ] Uses same travel/highlight language as Directions

## Data / domain

Edge id + endpoints

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

- None major

## References

- Item: ITEM-008
- Related SPECs: SPEC-005, SPEC-007
