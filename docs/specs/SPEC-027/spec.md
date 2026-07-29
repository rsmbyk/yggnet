---
id: SPEC-027
item: ITEM-027
type: feat
feature_area: persist
bump: minor
status: ready
title: "Templates + random graph"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-027: Templates + random graph

## Problem

Empty-world problem; no templates or random generator.

## Goals

- Templates: blank/org/roadmap/learning
- Random graph generator

## Non-goals

- Marketplace of templates

## Users & context

Mode focus: **Manager / new graph flow**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-027. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Create a new graph from a template
- [ ] Generate a random graph with basic parameters

## Data / domain

seed documents

## Algorithms / traces (if any)

Random graph gen

## Persistence / import-export (if any)

New document

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Random may be huge — clamp sizes

## References

- Item: ITEM-027
- Related SPECs: SPEC-001, SPEC-021
