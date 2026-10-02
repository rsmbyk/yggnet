# Plan 102: Analyze result panel hierarchy

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-110
- **Bump:** patch

## Why

In a constrained viewport, the Result/Trace navigation and legend can scroll away, long result
collections are harder to scan than Trace data structures, and failure/rejection states need clearer
visual distinction.

## Approach

Structure the panel as fixed header/navigation and a constrained scrollable content region, keeping
the active view’s legend accessible. Reuse the expandable data-structure visual pattern for long
result lists. Separate an eligible analysis with no solution from an analysis rejected for invalid
or unsupported input using distinct high-contrast status treatments and accessible headings.

## TDD and delivery

Add policy tests for outcome classification and UI tests for sticky controls, scroll behavior,
expandable lists, and contrast/status differentiation. Deliver on
`fix/102-analysis-result-panel-usability`.
