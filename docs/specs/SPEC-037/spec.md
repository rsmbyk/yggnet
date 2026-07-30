---
id: SPEC-037
item: ITEM-037
type: feat
feature_area: manager
bump: minor
status: done
title: "Attachments on nodes and edges"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-037: Attachments on nodes and edges

## Problem

GraphDocument supports attachments[] and notes work, but there is no manager UI to add, list, or remove attachments.

## Goals

- Add/list/remove local attachments on selected node or edge
- Persist in GraphDocument JSON
- Undoable where other field edits are

## Non-goals

- Remote blob hosting
- Cloud sync
- Large binary CDN

## Users & context

Mode focus: **Manager**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

Hardening after 0.21.1 — prior card archived as released but incomplete (SPEC-026).

## Behavior & UX

Implements ITEM-037. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [x] User can add an attachment to the selected node or edge (name + local payload)
- [x] Attachments list is visible and removable in the manager
- [x] Attachments persist in GraphDocument JSON (save/load/import/export)
- [x] Attachment changes are undoable where other field edits are
- [x] No remote hosting or file-sync backend

## Data / domain

attachments[] on nodes/edges; ops to add/remove

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Local name + data URL or text blob in document JSON

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- localStorage size limits — keep payloads modest; warn if huge

## References

- Item: ITEM-037
- Related SPECs: SPEC-026, SPEC-021, SPEC-023
- Prior SPECs: SPEC-026
