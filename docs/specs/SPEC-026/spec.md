---
id: SPEC-026
item: ITEM-026
type: feat
feature_area: manager
bump: minor
status: ready
title: "Notes and attachments"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-026: Notes and attachments

## Problem

Nodes/edges cannot carry notes and attachments.

## Goals

- Notes on nodes and edges
- Attachment refs
- Show for selection

## Non-goals

- Full file hosting backend

## Users & context

Mode focus: **Manager**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-026. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Add/edit notes on nodes and edges
- [ ] Attach refs/files/links per element
- [ ] Manager shows notes/attachments for selection

## Data / domain

notes + attachments arrays

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

In document; blob refs local later

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Large attachments — limit size

## References

- Item: ITEM-026
- Related SPECs: SPEC-001, SPEC-018
