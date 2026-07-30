---
id: SPEC-035
item: ITEM-035
type: feat
feature_area: analyze
bump: minor
status: draft
title: "Compare stored runs dual view"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-035: Compare stored runs dual view

## Problem

Users can store runs, but comparing two stored runs still looks like a single merged overlay rather than a dual view.

## Goals

- Pick two stored runs from Analyze history
- Dual overlay or side-by-side
- Mark stale runs clearly

## Non-goals

- Multi-run >2
- Cloud run sharing

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-013).

## Behavior & UX

Implements ITEM-035. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] User can select two stored runs from Analyze history
- [ ] World/manager show a dual overlay or side-by-side result for those runs
- [ ] Each run remains visually distinguishable
- [ ] Stale runs are clearly marked and do not silently look current
- [ ] Clearing compare restores the previous single-run view

## Data / domain

setCompareRunIds / run store; dual overlay rendering

## Algorithms / traces (if any)

N/A (replay stored results/traces)

## Persistence / import-export (if any)

Runs in document/session as today

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Stale + dual UX confusion — label clearly

## References

- Item: ITEM-035
- Related SPECs: SPEC-013, SPEC-034, SPEC-011
- Prior SPECs: SPEC-013
