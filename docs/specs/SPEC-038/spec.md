---
id: SPEC-038
item: ITEM-038
type: feat
feature_area: manager
bump: minor
status: done
title: "Save/load named docs + palette find"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-038: Save/load named docs + palette find

## Problem

Persist uses a fixed localStorage slot, and palette find does not use the richer query/jump path agreed for command palette.

## Goals

- Named save slots and/or download/open file
- Explicit overwrite/replace affordance
- Palette find via query → jump/select node

## Non-goals

- Cloud sync
- Multi-user presence
- Full fuzzy search ranking beyond simple query

## Users & context

Mode focus: **Manager + command palette**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-021, SPEC-025).

## Behavior & UX

Implements ITEM-038. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] User can save under a name (slot) and/or download GraphDocument JSON as a file
- [x] User can open a named slot and/or pick a local JSON file to load
- [x] Overwrite / replace current document is explicit (confirm or clear affordance)
- [x] Command palette find accepts a query, lists matches, and jumps/selects the chosen node
- [x] Autosave behavior remains available and does not replace explicit named save

## Data / domain

serialize/parse; named slot keys; findNodeByQuery (or equivalent) wired to palette

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

localStorage named slots + file download/open; autosave remains

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Accidental overwrite — require confirm
- File picker browser differences

## References

- Item: ITEM-038
- Related SPECs: SPEC-021, SPEC-025, SPEC-022, SPEC-023
- Prior SPECs: SPEC-021, SPEC-025
