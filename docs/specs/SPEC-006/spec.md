---
id: SPEC-006
item: ITEM-006
type: feat
feature_area: directions
bump: minor
status: ready
title: "Pathfinder A to B"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-006: Pathfinder A to B

## Problem

No A→B pathfinding UX: all paths, shortest ties, select, technical highlight.

## Goals

- List all simple paths (capped)
- Shortest mode with all ties
- Select path + technical overlay

## Non-goals

- Guided travel (ITEM-007)
- Full algo picker (ITEM-009) — may use BFS initially

## Users & context

Mode focus: **Directions + manager path panel**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-006. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Pick A and B and list all simple paths (with caps later)
- [ ] Shortest mode shows all equal-length shortest paths
- [ ] Selecting a path highlights it technically in the world

## Data / domain

Path results + overlays

## Algorithms / traces (if any)

At least BFS unweighted; respect directed when set

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

- Path explosion — enforce max results/depth

## References

- Item: ITEM-006
- Related SPECs: SPEC-002, SPEC-007, SPEC-009, SPEC-010
