---
id: SPEC-010
item: ITEM-010
type: feat
feature_area: analyze
bump: minor
status: ready
title: "Cached traces + step replay"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-010: Cached traces + step replay

## Problem

Runs do not cache traces for step replay without recompute.

## Goals

- Result-first UX
- Cache trace on Run
- Playback/scrub Show steps

## Non-goals

- Annotate steps (ITEM-014)

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-010. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Run shows final result immediately
- [ ] Trace stored on the run
- [ ] Show steps plays/scrubs cached events without recomputing

## Data / domain

runs + TraceEvent[]

## Algorithms / traces (if any)

All registered algos emit traces

## Persistence / import-export (if any)

Runs in session/memory initially

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Huge traces — cap events

## References

- Item: ITEM-010
- Related SPECs: SPEC-009, SPEC-011, SPEC-014
