---
id: SPEC-012
item: ITEM-012
type: feat
feature_area: analyze
bump: minor
status: ready
title: "Algo compare"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-012: Algo compare

## Problem

Cannot compare two algorithms on the same inputs.

## Goals

- Select two algorithms same A/B or action
- Show both results
- Hook to compare-runs

## Non-goals

- Full dual overlay chrome (ITEM-013)

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-012. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Pick two algorithms for the same inputs
- [ ] Show both results for comparison
- [ ] Can feed into compare-runs overlays

## Data / domain

two Run records

## Algorithms / traces (if any)

Uses registry

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

- UI clutter

## References

- Item: ITEM-012
- Related SPECs: SPEC-009, SPEC-013
