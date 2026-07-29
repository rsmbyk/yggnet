---
id: SPEC-015
item: ITEM-015
type: feat
feature_area: world
bump: patch
status: ready
title: "Pin / anchor nodes"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-015: Pin / anchor nodes

## Problem

Nodes cannot be pinned against layout movement.

## Goals

- Pin/unpin
- Pinned positions stable

## Non-goals

- Full layout engine

## Users & context

Mode focus: **Manager + Explore**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-015. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Pin and unpin a node
- [ ] Pinned nodes keep position across layout updates

## Data / domain

GraphNode.pinned

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

- None

## References

- Item: ITEM-015
- Related SPECs: SPEC-001, SPEC-004
