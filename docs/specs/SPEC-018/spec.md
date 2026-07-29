---
id: SPEC-018
item: ITEM-018
type: feat
feature_area: manager
bump: minor
status: ready
title: "Diff two nodes"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-018: Diff two nodes

## Problem

No side-by-side node diff with optional path between them.

## Goals

- Diff two nodes meta
- Optional path highlight

## Non-goals

- Three-way diff

## Users & context

Mode focus: **Manager + Directions overlay**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-018. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Select two nodes and open diff
- [ ] Show metadata side-by-side
- [ ] Offer path highlight between them

## Data / domain

selection of two ids

## Algorithms / traces (if any)

May call pathfinder

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

- Depends on SPEC-006 for path

## References

- Item: ITEM-018
- Related SPECs: SPEC-005, SPEC-006
