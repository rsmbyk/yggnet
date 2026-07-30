---
id: SPEC-034
item: ITEM-034
type: feat
feature_area: analyze
bump: minor
status: done
title: "Compare algorithms dual view"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-034: Compare algorithms dual view

## Problem

Compare API and a merged overlay exist, but results are not visually dual or side-by-side as agreed.

## Goals

- Compare two algorithms on the same A–B (or shared action)
- Distinguishable dual overlay or side-by-side UI
- Dismiss compare cleanly

## Non-goals

- Comparing more than two algorithms
- Auto-rerun on stale
- Worker runner

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-012).

## Behavior & UX

Implements ITEM-034. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] User picks two algorithms and the same A–B (or shared action)
- [ ] Results show in a dual overlay or clear side-by-side comparison
- [ ] Each algorithm’s path/result is visually distinguishable
- [ ] User can dismiss compare and return to a single overlay
- [ ] Stale rules still apply if the graph is edited

## Data / domain

Registry runs; compare overlay kind with two distinguishable series

## Algorithms / traces (if any)

Reuse existing registered algos (bfs/dijkstra/astar+)

## Persistence / import-export (if any)

Runs already stored; compare is session/UI over stored or fresh results

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Colorblind-safe dual encoding
- Overlay clutter

## References

- Item: ITEM-034
- Related SPECs: SPEC-012, SPEC-035, SPEC-009
- Prior SPECs: SPEC-012
