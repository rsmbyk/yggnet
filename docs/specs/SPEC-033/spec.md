---
id: SPEC-033
item: ITEM-033
type: feat
feature_area: world
bump: minor
status: draft
title: "Pin respected by layout"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-033: Pin respected by layout

## Problem

Pin checkbox/API exist but nothing moves nodes, so pin has no observable product effect.

## Goals

- Explicit layout or re-layout action
- Move unpinned nodes; leave pinned fixed
- Undoable layout pass

## Non-goals

- Large continuous force simulation as default always-on motion
- Live floating nodes (parked)
- Cloud layout services

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-015).

## Behavior & UX

Implements ITEM-033. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] User can pin/unpin nodes (existing control is fine if wired)
- [ ] A layout or re-layout action moves unpinned nodes
- [ ] Pinned nodes keep their positions across that layout pass
- [ ] Layout changes are undoable
- [ ] Works with nodes placed via SPEC-032 drag/edit when that lands

## Data / domain

Pin flag on nodes; layout op producing position updates for unpinned only

## Algorithms / traces (if any)

Minimal layout (e.g. simple force / grid / spring) — keep small

## Persistence / import-export (if any)

Updated positions in document

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Layout quality vs scope — prefer simple + undoable

## References

- Item: ITEM-033
- Related SPECs: SPEC-015, SPEC-032
- Prior SPECs: SPEC-015
