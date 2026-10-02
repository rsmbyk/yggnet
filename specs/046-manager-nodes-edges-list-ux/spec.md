---
id: SPEC-046
item: ITEM-046
type: feat
feature_area: manager
bump: minor
status: done
title: 'Manager Nodes/Edges list UX'
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-046: Manager Nodes/Edges list UX

## Problem

Nodes and Edges lists need searchable, filterable UX with companion editing and clear visual hierarchy.

## Goals

- Nodes list search; Edges TagPicker-style filter with Nodes/Tags groups
- Edge weight pills when weight ≠ 1; delete on same row
- Edges companion sheet (source/dest/direction/weight/tags/notes)
- List-search section headers read as groups; Escape dismiss rules

## Non-goals

- Server-side search
- Bulk CSV import UI

## Users & context

Mode focus: **Manager**.
UI/UX: quiet chrome; world remains the visual anchor.

Formalizes vibe session work already on `vibe/session-20260730`.

## Behavior & UX

Implements ITEM-046. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] Edges filter shows Nodes vs Tags sections with Tag badge on tag rows
- [x] Edge weight ≠ 1 shows as number pill
- [x] Companion sheet opens for edge create/edit without a Label field
- [x] nodeListFilter / edgeListFilter drive list queries

## Data / domain

nodeListFilter.ts; edgeListFilter.ts; TagPicker; NodeSearchSelect

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

N/A

## Test strategy

### Unit / domain (`src/lib/graph/**`)

nodeListFilter.test.ts; edgeListFilter.test.ts

### Component / UI behavior

N/A

### Playwright (E2E)

manager-edges.e2e.ts: open Edges tool; filter field present

## Risks & open questions

- Keep product code identical to vibe tip except intentional SPEC-040 deltas

## References

- Item: ITEM-046
- Related SPECs: SPEC-039…SPEC-046 (vibe formalization)
- Notes: `vibe-session-notes.md`
