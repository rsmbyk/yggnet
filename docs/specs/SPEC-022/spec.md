---
id: SPEC-022
item: ITEM-022
type: feat
feature_area: persist
bump: patch
status: ready
title: "Autosave"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-022: Autosave

## Problem

Refresh loses in-progress graph.

## Goals

- Debounced autosave
- Restore on load

## Non-goals

- Multi-document autosave slots UI

## Users & context

Mode focus: **App session**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-022. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Document autosaves locally on change (debounced)
- [ ] Reload restores last autosaved document

## Data / domain

serialize document

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

localStorage/IndexedDB

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Quota limits

## References

- Item: ITEM-022
- Related SPECs: SPEC-021
