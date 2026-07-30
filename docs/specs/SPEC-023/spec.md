---
id: SPEC-023
item: ITEM-023
type: feat
feature_area: persist
bump: minor
status: done
title: "Import / export JSON"
created: 2026-07-30
updated: 2026-07-30
---

# SPEC-023: Import / export JSON

## Problem

No portable JSON import/export.

## Goals

- Export JSON
- Import valid JSON
- Clear errors on invalid

## Non-goals

- CSV

## Users & context

Mode focus: **Manager**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-023. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

- [ ] Export current graph as JSON file
- [ ] Import valid JSON into a GraphDocument
- [ ] Invalid JSON fails with a clear error

## Data / domain

schemaVersion validation

## Algorithms / traces (if any)

N/A

## Persistence / import-export (if any)

Files

## Test strategy

### Unit / domain (`src/lib/graph/**`)

- TDD for all domain changes; keep coverage fence ≥90% on `src/lib/graph/**`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

- Untrusted JSON — size limits

## References

- Item: ITEM-023
- Related SPECs: SPEC-021
