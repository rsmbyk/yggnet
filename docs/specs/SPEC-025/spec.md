---
id: SPEC-025
item: ITEM-025
type: feat
feature_area: meta
bump: minor
status: ready
title: "Command palette"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-025: Command palette

## Problem

Power actions are hard to reach without hunting panels.

## Goals

- Shortcut opens palette
- Find nodes
- Invoke key actions

## Non-goals

- Full vim mode

## Users & context

Mode focus: **Global**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-025. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Open palette with a shortcut
- [ ] Search nodes and jump/focus
- [ ] Invoke key actions (directions, run algo) from palette

## Data / domain

uses selection + session

## Algorithms / traces (if any)

Can trigger analyze

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

- Shortcut conflicts

## References

- Item: ITEM-025
- Related SPECs: SPEC-005, SPEC-006, SPEC-009
