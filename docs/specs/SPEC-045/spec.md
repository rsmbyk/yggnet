---
id: SPEC-045
item: ITEM-045
type: feat
feature_area: manager
bump: minor
status: done
title: 'Toolbar + tools panel chrome'
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-045: Toolbar + tools panel chrome

## Problem

Tools need a vertical icon rail and a sticky glass panel shell without dominating the world.

## Goals

- Toolbar opens one tool section at a time
- Tools panel: sticky header / scroll body / sticky footer
- Glass panels + calm fade/fly motion with prefers-reduced-motion
- Panel height limit helper

## Non-goals

- Dockable multi-panel layouts
- User-themed chrome

## Users & context

Mode focus: **Manager**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-045. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] yggnet-toolbar lists tool ids from tool-ids
- [x] Opening a tool shows the tools panel with sticky chrome
- [x] tools-panel-limit computes max height
- [x] Escape closes pickers without always closing the whole tools panel (per existing rules)

## Data / domain

tool-ids.ts; tools-panel-limit.ts; forward-wheel.ts

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

tool-ids.test.ts; tools-panel-limit.test.ts; forward-wheel.test.ts

### Component / UI behavior

N/A

### Playwright (E2E)

tools-panel-height.e2e.ts; shell opens toolbar

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-045
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
