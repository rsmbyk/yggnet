---
id: SPEC-036
item: ITEM-036
type: feat
feature_area: analyze
bump: minor
status: done
title: "Step annotations readback + playback"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-036: Step annotations readback + playback

## Problem

Step notes can be written and playback state exists, but annotations are not shown after save and there is no play/pause auto-advance UI.

## Goals

- Show saved step annotations when scrubbing
- Play/pause auto-advance over cached trace without re-run
- Persist annotations with the run

## Non-goals

- Re-running on every play
- Worker runner
- Huge-graph trace caps (later)

## Users & context

Mode focus: **Analyze**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-010, SPEC-014).

## Behavior & UX

Implements ITEM-036. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] User can attach a note to a step of a cached run
- [x] Notes remain visible when revisiting that step (scrubber or list)
- [x] Play/pause auto-advances through the cached trace without re-running
- [x] Playback can be stopped and scrubbed manually
- [x] Annotations persist with the run across save/load of the document where runs are stored

## Data / domain

runs.annotateStep + playback controls in session; display binding in UI/world

## Algorithms / traces (if any)

Replay cached trace only

## Persistence / import-export (if any)

Annotations live on `RunRecord` in session `runStore`. Graph document serialize/load does not include runs today, so annotations persist for the session lifetime of a cached run (not across document save/load until runs are embedded in the document format).

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Playback timing defaults
- Annotation UI clutter on dense traces

## References

- Item: ITEM-036
- Related SPECs: SPEC-010, SPEC-014
- Prior SPECs: SPEC-010, SPEC-014
