---
id: SPEC-029
item: ITEM-029
type: feat
feature_area: world
bump: minor
status: ready
title: "Multi-select nodes (and edges)"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-029: Multi-select nodes (and edges)

## Problem

Selection is single-node only, so manager and world cannot share a multi-id set and multi-node groups cannot be built from the UI.

## Goals

- Modifier-based multi-select in manager and world
- Selection API holds multiple nodeIds (and optionally edgeIds)
- Keep manager list and world highlight in sync for the full set

## Non-goals

- Multi-node groups UI (ITEM-030 / SPEC-030)
- Range-select lasso
- Changing pathfinder/analyze single-target semantics beyond one primary when multi-selected

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-005).

## Behavior & UX

Implements ITEM-029. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] User can add/remove nodes from selection via modifier click (or equivalent) in manager and world
- [ ] Selection API holds multiple nodeIds (and optionally edgeIds) without collapsing to one
- [ ] Manager list and world highlight stay in sync for the full set
- [ ] Clear-selection and single-select still work
- [ ] Existing single-select flows (pathfinder A/B, analyze, edit panel) remain usable when one item is selected

## Data / domain

selection.ts: multi-id selection model; toggle/add/remove/clear APIs.

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A (selection is session state)

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Edit panel ambiguity when many selected — show count / primary
- Re-render loops on large sets

## References

- Item: ITEM-029
- Related SPECs: SPEC-005, SPEC-030
- Prior SPECs: SPEC-005
