# Plan 051: Manager layout polish

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Items:**
  - ITEM-054
  - ITEM-055
  - ITEM-057
  - ITEM-059
  - ITEM-060
- **Bump:** patch

## Why

The manager chrome has five small layout polish issues found together in screenshots: Tags search placement, Tags row overlap (P1 regression), Nodes/Edges header misalignment, tag helper spacing, and a too-light success green. One cohesive CSS slice keeps them consistent.

## Scope / edges

**In:**

- Tags search as a full-width row below the `Tags` title
- Tags row header/action stacking with no overlap, keeping ITEM-051 click-target behavior
- Fixed `.manager__header-row` min-height so Nodes/Edges filters align
- Tag-edit helper scoped spacing tightening
- Darker helper-scoped success green

**Out:**

- Tag charset, validation, rename, focus, delete, or ordering semantics
- Session/selection behavior (SPEC-052)
- Empty states (SPEC-053)
- Global success-token change beyond the helper

## Approach

CSS + markup order changes in `src/lib/ui/ManagerPanel.svelte` only. Keep all `data-testid` hooks, aria labels, filtering, validation, and focus behavior. Verify with Playwright plus header/row geometry assertions.

## TDD

- Domain/app tests: none expected (presentation-only); record if any helper is added
- E2E (tool named after stack exists): extend `e2e/tags-tool.e2e.ts` for search placement, row overlap, header heights, helper spacing/color

## Risks

- Absolute-positioned row-main fix could narrow the ITEM-051 click target; keep full non-action activation with visible keyboard focus.
- Header min-height must match the real button height across densities; measure, don't hardcode blindly.
