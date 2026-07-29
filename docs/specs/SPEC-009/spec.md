---
id: SPEC-009
item: ITEM-009
type: feat
feature_area: analyze
bump: minor
status: ready
title: "Algorithm registry + picker"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-009: Algorithm registry + picker

## Problem

No pluggable algorithm registry or extensive shortest-path picker.

## Goals

- Algorithm registry with needs metadata
- Picker UI in Analyze
- Run via AlgorithmRunner

## Non-goals

- Worker thread impl (later)
- Every algorithm on day one — ship registry + BFS/Dijkstra/A* minimum

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-009. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Algorithms registered by id with needs metadata
- [ ] UI picker lists available shortest-path algorithms
- [ ] Unknown/unsupported needs are blocked with clear messaging

## Data / domain

algorithms registry

## Algorithms / traces (if any)

BFS, Dijkstra, A* minimum; extensible

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

- Scope creep on algorithm count

## References

- Item: ITEM-009
- Related SPECs: SPEC-006, SPEC-010, SPEC-012
