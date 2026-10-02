---
id: SPEC-106
item: ITEM-114
type: fix
feature_area: tags
bump: patch
status: Accepted
title: 'Refine focused Tags row hover and focus states'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Refine focused Tags row hover and focus states

- **Status:** Accepted

## Intent

Make a focused Tags row comfortable to hover and visually clear without the current white hover
highlight or decorative green ring.

## Scope

**In:** visual states for the Tags row representing the item focused by the Tags tool; pointer hover;
keyboard-visible focus.

**Out:** changing which item is focused, tag filtering/actions, other row types, or global focus design.

## Rules

- Hovering the focused row uses a restrained theme-consistent treatment; it must not become a bright
  white highlight that reduces label readability.
- The focused-row selection/focus decoration does not show the unwanted green ring.
- Keyboard `:focus-visible` retains a clear, high-contrast indicator distinguishable from the
  row’s active/focused state.
- Hover, active, and keyboard-focus states remain visually distinguishable and preserve readable
  text contrast.

## Acceptance scenarios

### Scenario: Hover the focused Tags row

**Given** the Tags tool has a focused row
**When** the pointer hovers that row
**Then** it uses a restrained non-white hover treatment, the label stays readable, and no green ring
appears.

### Scenario: Navigate to the row by keyboard

**Given** keyboard navigation reaches the focused Tags row
**When** the row receives visible keyboard focus
**Then** a clear high-contrast focus indicator appears without using the unwanted green ring.

### Scenario: Distinguish hover from active focus

**Given** a focused Tags row is hovered and then no longer hovered
**When** the pointer leaves
**Then** the active/focused row styling remains, while only the hover-specific treatment is removed.

## Traceability

- Domain/app tests: focused Tags row/component style tests.
- E2E: existing Tags tool UI E2E suite.
- Implementation: pending Draft acceptance.
