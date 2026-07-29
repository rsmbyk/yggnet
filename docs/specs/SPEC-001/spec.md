---
id: SPEC-001
item: ITEM-001
type: feat
feature_area: manager
bump: minor
status: ready
title: "Manager graph CRUD"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-001: Manager graph CRUD

## Problem

Users cannot yet build or edit graph structure from the outer manager.

## Goals

- CRUD nodes and edges in the manager
- Support disconnected components in one document
- Keep world in sync with document mutations

## Non-goals

- In-world create UI
- Import/export (ITEM-023)
- Undo stack (ITEM-024)

## Users & context

Mode focus: **Manager + Explore (document shared)**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-001. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Create, edit, and delete nodes from the manager
- [ ] Create, edit, and delete edges between existing nodes
- [ ] Disconnected components remain one GraphDocument
- [ ] Edits update the shared document used by the world

## Data / domain

GraphDocument nodes/edges maps; ops to add/update/remove.

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

In-memory session document only unless other SPECs landed.

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Large graphs may need virtualized lists later

## References

- Item: ITEM-001
- Related SPECs: SPEC-002, SPEC-004, SPEC-005, SPEC-024
