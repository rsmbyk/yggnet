---
id: SPEC-002
item: ITEM-002
type: feat
feature_area: manager
bump: minor
status: done
title: "Edge weight + directed"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-002: Edge weight + directed

## Problem

Edges lack first-class direction and weight required for many algorithms and org/roadmap semantics.

## Goals

- Store directed + weight on edges
- Edit both in manager
- Feed weighted/directed algos

## Non-goals

- UI for algorithm picker (ITEM-009)
- Pathfinding itself (ITEM-006)

## Users & context

Mode focus: **Manager**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-002. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Edges store directed boolean and numeric weight
- [ ] Manager can edit direction and weight
- [ ] Undirected and directed graphs both supported

## Data / domain

GraphEdge.directed, GraphEdge.weight; defaults documented.

## Algorithms / traces (if any)

Enables Dijkstra/A* later

## Persistence / import-export (if any)

Included in document schema

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Migration if older docs lack fields — use defaults

## References

- Item: ITEM-002
- Related SPECs: SPEC-001, SPEC-006, SPEC-009
