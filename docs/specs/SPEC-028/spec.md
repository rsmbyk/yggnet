---
id: SPEC-028
item: ITEM-028
type: feat
feature_area: meta
bump: patch
status: done
title: "Simple clean modern chrome"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-028: Simple clean modern chrome

## Problem

Chrome may grow noisy without a deliberate simple/clean/modern pass.

## Goals

- Minimal default chrome
- Progressive disclosure
- Panels do not overpower world

## Non-goals

- New visual brand illustration

## Users & context

Mode focus: **All modes**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-028. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Default chrome stays minimal
- [ ] Details appear on selection or mode entry
- [ ] Panels do not compete with the world

## Data / domain

N/A

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

- Subjective — use checklist AC

## References

- Item: ITEM-028
- Related SPECs: SPEC-001, SPEC-007, SPEC-009
