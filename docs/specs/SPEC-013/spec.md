---
id: SPEC-013
item: ITEM-013
type: feat
feature_area: analyze
bump: minor
status: done
title: "Compare runs"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-013: Compare runs

## Problem

Stored runs cannot be compared visually side-by-side.

## Goals

- Pick two runs
- Dual overlay or split result panels
- Keep chrome calm

## Non-goals

- Multi-run >2

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-013. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Select two stored runs to compare
- [ ] World/manager can show dual overlays without clutter overload

## Data / domain

runs store

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

- Visual noise — default one hero overlay

## References

- Item: ITEM-013
- Related SPECs: SPEC-010, SPEC-012
