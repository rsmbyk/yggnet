---
id: SPEC-011
item: ITEM-011
type: feat
feature_area: analyze
bump: patch
status: ready
title: "Stale-run invalidation"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-011: Stale-run invalidation

## Problem

Edits can leave algorithm results looking current when they are not.

## Goals

- Mark runs stale on graph mutation
- Clear UI stale state
- Re-run refreshes

## Non-goals

- Auto-rerun

## Users & context

Mode focus: **Analyze + Manager edits**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-011. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Editing the graph after a run marks that run stale
- [ ] UI indicates stale results clearly
- [ ] Re-run refreshes result and trace

## Data / domain

Run.stale flag

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

- Which mutations count — define set

## References

- Item: ITEM-011
- Related SPECs: SPEC-010, SPEC-001, SPEC-024
