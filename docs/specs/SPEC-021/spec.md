---
id: SPEC-021
item: ITEM-021
type: feat
feature_area: persist
bump: minor
status: ready
title: "Save / load graph"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-021: Save / load graph

## Problem

No explicit save/load of graph documents.

## Goals

- Save document
- Load into session

## Non-goals

- Cloud sync
- Autosave (ITEM-022)

## Users & context

Mode focus: **Manager**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-021. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Save current document to a user-chosen location or named slot
- [ ] Load replaces or opens into the session cleanly

## Data / domain

GraphDocument serialize

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

File or named local slot

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Overwrite confirmations

## References

- Item: ITEM-021
- Related SPECs: SPEC-022, SPEC-023
