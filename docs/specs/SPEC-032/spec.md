---
id: SPEC-032
item: ITEM-032
type: feat
feature_area: world
bump: minor
status: ready
title: "Node drag / position edit"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-032: Node drag / position edit

## Problem

Nodes are spiral-auto-placed on add with no drag or position editor, so users cannot place structure deliberately.

## Goals

- Drag nodes in the world to new positions
- And/or edit position in the manager
- Persist positions; undo via command stack

## Non-goals

- Live floating motion (parked)
- Full force-directed continuous sim (see SPEC-033)
- Camera bookmarks

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-004).

## Behavior & UX

Implements ITEM-032. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] User can drag a node in the world to a new position
- [ ] And/or edit x/y/z (or equivalent) in the manager for the selected node
- [ ] Position writes into the GraphDocument and survive save/load
- [ ] Position changes are undoable/redoable via the command stack
- [ ] Drag does not break selection sync or camera controls unexpectedly

## Data / domain

GraphNode position fields; undoable update ops

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Positions already in document; ensure save/load round-trip

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- OrbitControls vs drag conflict — pointer capture / modifier

## References

- Item: ITEM-032
- Related SPECs: SPEC-004, SPEC-015, SPEC-033
- Prior SPECs: SPEC-004
