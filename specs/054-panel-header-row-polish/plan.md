# Plan 054: Panel header row polish

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Items:**
  - ITEM-061
  - ITEM-062
- **Bump:** patch

## Why

Two follow-up polish issues from the SPEC-051 Tags work: airy header-to-content spacing, and a row editor target that only covers the label block instead of the whole card.

## Scope / edges

**In:**

- Tighter header→content gaps (panel-wide preferred; lock at Accept)
- Full-card Tags row target via grid-stretch, actions unmoved and overlap-free

**Out:**

- Any behavior change (filtering, focus, selection, validation)
- Regressing ITEM-057 Nodes/Edges alignment or ITEM-051 click-target/focus rules

## Approach

CSS + minor markup order in `src/lib/ui/ManagerPanel.svelte` only. Measure before/after geometry for the gap; prove no-overlap plus whole-card activation for the row.

## TDD

- Domain/app tests: none expected (presentation-only)
- E2E: extend `e2e/tags-tool.e2e.ts` (gap geometry, whole-card activation/focus ring, action independence, header alignment)

## Risks

- Shrinking the panel gap too far cramps dense panels; pick values against the 051 geometry assertions.
- Grid-stretch must keep the three action buttons independently clickable with visible keyboard focus.
