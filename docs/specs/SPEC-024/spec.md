---
id: SPEC-024
item: ITEM-024
type: feat
feature_area: manager
bump: minor
status: done
title: "Undo / redo"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-024: Undo / redo

## Problem

Graph edits are not undoable.

## Goals

- Undo/redo command stack
- Works for manager mutations

## Non-goals

- Undo camera moves

## Users & context

Mode focus: **Manager**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-024. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Undo reverses last graph edit
- [ ] Redo reapplies
- [ ] Stack clears or adjusts appropriately on load

## Data / domain

history/ commands

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Memory stack

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Stack vs load — clear on load

## References

- Item: ITEM-024
- Related SPECs: SPEC-001, SPEC-011
