# Plan 103: Analyze result presentation

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-111
- **Bump:** patch

## Why

Analyze results need clearer structure for long and grouped artifacts, accessible equivalents for
map-like data, and status surfaces that remain readable. The panel should use available viewport
space without allowing its controls or legend to scroll away.

## Scope / edges

**In:** Result/Trace separator; grow-to-available-height panel with body-only scrolling; disclosure
defaults and same-run state; data-structure spacing; partition sections; map/ranking tables; coloring
palette legend; No result/Rejected contrast and distinction.

**Out:** Algorithm outputs, analysis semantics, reveal timing, or new artifact kinds.

## Approach

Keep panel controls and the active legend outside the scroll body. Collapse expandable artifacts on
each new run, preserve toggles while that run remains active, and render grouped and map-like values
with semantic headings/tables. Use text labels in addition to color. Give No result and Rejected
separate high-contrast treatments.

## TDD

- UI/component tests: colocated Analyze result component/policy tests for disclosure lifecycle,
  semantic tables, grouped output, and status contrast tokens.
- E2E: extend `e2e/analyze-laboratory.e2e.ts` for scroll layout and representative partition,
  map/ranking, coloring, and status cases.

## Risks

- Keep sticky controls from consuming excessive height on smaller viewports; only the body should
  scroll after the panel reaches available height.
- Color must remain supplemental to names, text, and table headers.
