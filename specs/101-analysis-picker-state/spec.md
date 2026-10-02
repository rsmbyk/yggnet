---
id: SPEC-101
item: ITEM-109
type: fix
feature_area: analyze
bump: patch
status: Accepted
title: 'Analyze picker categories and shared inputs'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Analyze picker categories and shared inputs

- **Status:** Accepted

## Intent

Make a large algorithm catalog easier to scan and avoid losing compatible input selections when
switching between algorithms.

## Scope

**In:** group Analyze options by existing `category`; preserve shared input values during
algorithm switching; validate/default incompatible selections; domain/session and UI tests.

**Out:** search/filtering, reordering categories or algorithms, persisting values across page reloads,
and changing algorithm definitions or validation rules.

## Rules

- Algorithm options remain in their existing category and stored definition order, grouped under
  accessible category labels using native select semantics.
- During the Analyze panel session, an input value is retained when another algorithm has a field
  with the same `id` and `kind`; it remains cached while temporarily switching to a definition
  without that field.
- A retained node or node-set value is used only while every referenced node remains in the active
  graph. A missing node is cleared rather than submitted stale.
- A retained select/mode value is used only if it is still among the active field’s options;
  otherwise that field uses its defined default or first valid option.
- Other algorithm-specific fields retain their existing default/reset behavior. Values do not
  persist through reload or into graph persistence.

## Acceptance scenarios

### Scenario: Scan categories

**Given** the Analyze selector contains definitions from multiple categories
**When** it is opened with native keyboard or pointer controls
**Then** every algorithm appears under its existing category and can be selected accessibly.

### Scenario: Reuse shared route fields

**Given** an algorithm has selected Start, End, and Mode
**When** the user switches to another algorithm with matching field IDs and kinds
**Then** compatible values are retained; valid mode selection is also retained.

### Scenario: Switch away and back

**Given** a selected field is temporarily absent from the chosen algorithm
**When** the user switches back to an algorithm that has the compatible field
**Then** its prior session value returns unless it is no longer valid for the graph/options.
