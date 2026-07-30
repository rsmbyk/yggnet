---
id: SPEC-030
item: ITEM-030
type: feat
feature_area: world
bump: minor
status: draft
title: "Multi-node groups from UI"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-030: Multi-node groups from UI

## Problem

Group/collapse APIs and proxies exist, but the UI cannot select 2+ nodes, so real district groups are not usable.

## Goals

- Create a group from 2+ selected nodes
- Collapse and expand districts from manager and/or world
- Persist groups across save/load and undo/redo

## Non-goals

- Deep nested groups v2
- Auto-layout of districts (SPEC-033)
- Multi-select itself (SPEC-029)

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-016).

## Behavior & UX

Implements ITEM-030. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] With 2+ nodes selected, user can create a group (district container)
- [ ] Collapse and expand the group from manager and/or world
- [ ] Collapsed group shows a proxy in the world; expand restores member nodes
- [ ] Ungroup or dissolve is available without corrupting the document
- [ ] Groups persist across save/load and undo/redo

## Data / domain

Existing group entities/ops; wire to multi-selection; ungroup/dissolve.

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Groups in GraphDocument; schema-compatible with 0.21.1 docs

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Edge routing when collapsed
- Depends on SPEC-029 landing first

## References

- Item: ITEM-030
- Related SPECs: SPEC-016, SPEC-029, SPEC-004
- Prior SPECs: SPEC-016
