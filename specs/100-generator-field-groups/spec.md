---
id: SPEC-100
item: ITEM-108
type: fix
feature_area: ui
bump: patch
status: Accepted
title: 'Related generator field layout'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Related generator field layout

- **Status:** Accepted

## Intent

Visually group generator parameters that jointly describe a graph’s structure.

## Scope

**In:** Bipartite Left/Right fields; Helix Turns/Chord fields; responsive grouping and UI tests.

**Out:** Changing generator algorithms, parameter defaults/ranges, or other generator layouts.

## Rules

- Bipartite Left and Right are adjacent in one paired row at normal panel widths; Density remains
  separate rather than visually grouped with Left.
- Helix Turns and Chord are adjacent in one paired row at normal panel widths.
- On a narrow panel, a pair may stack vertically without changing order.
- Each input retains its existing label, validation constraints, and associated helper text.

## Acceptance scenarios

### Scenario: Configure a bipartite graph

**Given** Bipartite Graph is selected in Generate
**When** its fields are displayed at normal panel width
**Then** Left and Right share one row and Density is a separate field.

### Scenario: Configure a helix

**Given** Helix is selected in Generate
**When** its fields are displayed
**Then** Turns and Chord share one row, with both helpers correctly associated.

### Scenario: Narrow layout

**Given** the Generate panel is narrower than the paired controls can comfortably fit
**When** either generator is selected
**Then** its fields stack without clipping or losing labels/help.
