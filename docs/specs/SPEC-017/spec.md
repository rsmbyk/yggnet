---
id: SPEC-017
item: ITEM-017
type: feat
feature_area: manager
bump: minor
status: ready
title: "Filters by type/tag"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-017: Filters by type/tag

## Problem

Cannot filter the visible graph by type/tag/status.

## Goals

- Filter controls
- Hide/dim filtered-out
- Sync manager and world

## Non-goals

- Saved filter presets

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-017. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Filter nodes/edges by tag or type
- [ ] Filtered-out elements are hidden or strongly dimmed
- [ ] Filters sync between manager and world

## Data / domain

tags/types on nodes

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Filter state in session

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Empty view — show empty state

## References

- Item: ITEM-017
- Related SPECs: SPEC-004, SPEC-016, SPEC-025
