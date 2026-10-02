# Plan 100: Related generator field layout

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-108
- **Bump:** patch

## Why

Some generator parameters are a natural pair but the current vertical form layout visually
separates them from each other or places them after less-related controls.

## Approach

Introduce explicit layout grouping for Bipartite Left/Right and Helix Turns/Chord. Keep labels,
validation, and helper copy attached to each input; use a responsive layout that stacks the pair when
the panel is too narrow.

## TDD and delivery

Add UI tests for the paired grouping and narrow-panel fallback. Keep generator semantics and field
values unchanged. Deliver on `fix/100-generator-field-groups`.
