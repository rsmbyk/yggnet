---
id: SPEC-099
item: ITEM-107
type: fix
feature_area: ui
bump: patch
status: Accepted
title: 'Primary control affordances'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Primary control affordances

- **Status:** Accepted

## Intent

Make the Last result action easier to recognize and keep primary Generate/Run analysis labels
readable across interactive states.

## Scope

**In:** Last result icon; hover and focus-visible treatment of Generate and Run analysis primary
buttons; accessible button names; focused UI tests.

**Out:** Changing button copy, action behavior, the global color system, or other toolbar icons.

## Rules

- Last result keeps the accessible name “Last result”; its icon is decorative to assistive
  technology and follows the existing icon/button treatment.
- Generate and Run analysis retain sufficient foreground/background contrast in default, hover,
  focus-visible, active, and disabled states. Hover must not turn a light label into a low-contrast
  label against a light background.
- Both Generate and Analyze footer actions use the same primary action state contract.

## Acceptance scenarios

### Scenario: Recognize Last result

**Given** a completed analysis exists and the Analyze panel is closed
**When** the Last result action is shown
**Then** it has a decorative icon and keeps the accessible name “Last result”.

### Scenario: Read primary actions while hovering

**Given** Generate or Run analysis is enabled
**When** a pointer hovers or keyboard focus reaches the action
**Then** its label remains clearly legible against its state background.
