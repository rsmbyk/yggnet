# Plan 106: Tags focused-row hover

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-114
- **Bump:** patch

## Why

The currently focused Tags row receives an overly bright white hover fill and an unwanted green
ring. The row should feel deliberate without sacrificing visible keyboard focus.

## Scope / edges

**In:** pointer hover and selected/focused visual states for the focused-tag row in the Tags tool;
keyboard focus indication.

**Out:** tag filtering behavior, row selection semantics, other Tags rows, and global focus styling.

## Approach

Separate the active focused-row treatment from `:hover` and `:focus-visible`. Use a restrained
theme-consistent hover and remove the decorative green ring while retaining a clear keyboard focus
indicator.

## TDD

- UI tests: focused Tags row state/style tests using the established Tags component test convention.
- E2E: Tags tool coverage in the appropriate existing UI E2E suite.

## Risks

- Keep keyboard focus discernible without reintroducing the active-state green ring or white hover
  flash.
