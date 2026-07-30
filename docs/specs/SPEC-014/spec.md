---
id: SPEC-014
item: ITEM-014
type: feat
feature_area: analyze
bump: patch
status: done
title: "Annotate algorithm steps"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-014: Annotate algorithm steps

## Problem

Cannot annotate individual trace steps for teaching/notes.

## Goals

- Add note on step
- Persist with run
- Visible in replay

## Non-goals

- Rich attachments on steps

## Users & context

Mode focus: **Analyze playback**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-014. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Add a note to a trace step
- [ ] Notes persist with the run
- [ ] Notes visible during step replay

## Data / domain

step annotations map

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

With run record

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Schema growth

## References

- Item: ITEM-014
- Related SPECs: SPEC-010
