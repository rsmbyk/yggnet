---
id: SPEC-104
item: ITEM-112
type: fix
feature_area: generate
bump: patch
status: Accepted
title: 'Full-row layout for an unmatched Generate field'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Full-row layout for an unmatched Generate field

- **Status:** Accepted

## Intent

Use available form width for a final Generate field that has no related partner, while preserving
intentional field pairs.

## Scope

**In:** full-row layout for unmatched final fields; Bipartite Density; preserving paired Left/Right
and Helix Turns/Chord layouts at desktop and narrow widths.

**Out:** field order, copy, validation, defaults, and unrelated form layout changes.

## Rules

- An unmatched final field occupies the full available form row on layouts with multiple columns.
- Bipartite Left and Right remain together on one row, followed by Density spanning the full row.
- Helix Turns and Chord remain paired.
- Grid Rows and Columns remain paired as related dimensions when the full-row rule applies to the following unmatched control.
- On narrow layouts, all fields remain visible and usable without horizontal overflow.

## Acceptance scenarios

### Scenario: Bipartite controls

**Given** the Bipartite graph generator form is open at a multi-column width
**When** its fields are displayed
**Then** Left and Right share a row and Density spans the full row below them.

### Scenario: Preserve related Helix fields

**Given** the Helix generator form is open
**When** its fields are displayed
**Then** Turns and Chord remain paired and the unmatched-field rule does not alter their grouping.

### Scenario: Narrow viewport

**Given** a narrow Generate panel
**When** Bipartite or Helix fields are displayed
**Then** every field is visible and usable without horizontal scrolling of the form.

## Traceability

- Domain/app tests: Generate form layout policy/component tests.
- E2E: `e2e/generate-form.e2e.ts`.
- Implementation: `src/lib/ui/ManagerPanel.svelte`; related row/column and requested field pairs are grouped explicitly so a full-row unmatched field cannot accidentally stretch only one member of a pair.
