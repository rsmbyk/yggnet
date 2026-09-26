---
id: SPEC-050
item: ITEM-050
items:
  - ITEM-050
  - ITEM-051
  - ITEM-052
  - ITEM-053
type: fix
feature_area: manager
bump: patch
status: Accepted
title: 'Tags tool interaction and polish'
created: 2026-09-25
updated: 2026-09-25
---

# SPEC-050: Tags tool interaction and polish

## Problem

The Tags tool has several small UX issues: the rename helper does not explain valid tag syntax and is spaced too far from related controls; tag cards have a narrow editor click target; the editor panel uses a generic header; and search sits in the body as a bare input instead of the header.

## Scope

Improve the Tags tool as one cohesive UI slice:

- In the neutral/unchanged tag rename state, explain that valid tags use ASCII letters, digits, and hyphens. Keep invalid-character, duplicate, and valid-state feedback and save behavior. Place the helper close to the input with less excess space before Save; scope spacing changes to this helper.
- Make the full non-action area of a tag row/card open that tag's editor. Keep Show only, focus toggle, and delete actions independent. Preserve keyboard access and visible focus.
- Show the original/current tag label in the tag editor panel header. Keep the header tied to the original label while editing the draft, and show the new label after a successful rename.
- Move the existing Tags search input into the Tags panel header, style it as a proper input field with visible boundary, padding, and focus treatment, and render only one instance. Keep filtering, accessible naming, the Tags title, and clear-focus action functional.

## Acceptance scenarios

### Scenario: Rename helper gives syntax guidance

- **Given** the tag rename field is empty or unchanged from its original value
- **When** its helper is displayed
- **Then** it explains that allowed characters are letters, digits, and hyphens
- **And** it does not display “Same as original”
- **And** the helper sits close beneath the input with little trailing space before Save

### Scenario: Rename validation remains intact

- **Given** the draft contains a disallowed character or duplicates another tag
- **When** the helper is displayed
- **Then** the specific existing error message is shown and Save remains disabled
- **When** the draft is valid and non-conflicting
- **Then** the positive/available status remains clear and Save remains enabled
- **And** other helper spacing is unchanged

### Scenario: Click anywhere in non-action card area

- **Given** a tag row is visible
- **When** the user clicks blank or padded space within the card outside its action controls
- **Then** the editor for that tag opens
- **And** keyboard users can focus and activate the editor target with a visible focus indicator

### Scenario: Row actions remain independent

- **Given** a tag row is visible
- **When** the user activates Show only, focus toggle, or delete
- **Then** only that action occurs and the editor does not open as a side effect

### Scenario: Editor header identifies the tag

- **Given** the user opens the editor for a tag
- **When** the panel is displayed and the draft is edited but not saved
- **Then** the header shows the original/current tag label, not the generic “Tag” or draft value
- **When** a valid rename is saved and its editor is reopened
- **Then** the header shows the renamed tag label

### Scenario: Search is a header input

- **Given** the Tags tool is open
- **When** the panel is displayed
- **Then** one properly styled search input appears in the Tags header, not the body
- **And** its accessible name and visible focus treatment are retained
- **And** the Tags title and clear-focus action remain available
- **When** the user enters a query
- **Then** the existing tag filtering and empty/no-match states continue to work

## Non-goals

- Changing tag charset, validation rules, rename semantics, focus behavior, or tag ordering
- Changing search placement in Nodes or Edges tools
- Expanding click targets or changing headers in other tools
- Rewriting other field-helper styles

## Test strategy

- Playwright: `e2e/tags-tool.e2e.ts` covers helper copy/spacing, card whitespace activation, action independence, editor header updates, and search placement/styling/filtering
- Run focused Tags tool E2E and required repository checks
