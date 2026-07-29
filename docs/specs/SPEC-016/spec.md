---
id: SPEC-016
item: ITEM-016
type: feat
feature_area: world
bump: minor
status: done
title: "Groups / containers"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-016: Groups / containers

## Problem

No collapse/expand for subgraph districts.

## Goals

- Group nodes
- Collapse to district
- Expand in place

## Non-goals

- Deep nested groups v2

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-016. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Group nodes into a container
- [ ] Collapse group to a single district node
- [ ] Expand in place to reveal members

## Data / domain

groupId / group entities

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

In document

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Edge routing when collapsed

## References

- Item: ITEM-016
- Related SPECs: SPEC-004, SPEC-017
