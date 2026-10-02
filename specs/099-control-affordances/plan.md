# Plan 099: Primary control affordances

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-107
- **Bump:** patch

## Why

The Last result action needs a recognizable visual cue, and the primary action buttons currently
lose label readability on hover.

## Approach

Add a consistent decorative icon to Last result without changing its accessible name. Align hover
and focus-visible styling for Generate and Run analysis so the foreground/background pairing stays
legible, while preserving disabled and active behavior.

## TDD and delivery

Add user-visible tests for accessible naming and hover/focus contrast behavior. Keep the change
limited to these shared control affordances and deliver on `fix/099-control-affordances`.
