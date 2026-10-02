# Plan 101: Analyze picker and shared input state

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-109
- **Bump:** patch

## Why

The growing Analyze catalog is difficult to scan as one flat list, and switching algorithms clears
common fields such as Start, End, or Mode even when the next algorithm uses the same field.

## Approach

Group selector options by the existing algorithm category. Keep session-local field values keyed by
compatible field identity across algorithm changes, preserve values while switching through an
algorithm that omits a field, and safely clear/default values that no longer apply to the selected
definition or current graph.

## TDD and delivery

Add tests for accessible category grouping, shared-field preservation, mode choices, and stale-node
selection handling. Deliver on `fix/101-analysis-picker-state`.
