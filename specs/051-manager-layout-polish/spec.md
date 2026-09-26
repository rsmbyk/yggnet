# Spec: Manager layout polish

- **ID:** 051
- **Status:** Accepted
- **Items:**
  - ITEM-054
  - ITEM-055
  - ITEM-057
  - ITEM-059
  - ITEM-060
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** patch

## Intent

Polish the manager panel layout without changing behavior: Tags search below the title, non-overlapping tag rows, aligned Nodes/Edges headers, tighter rename helper spacing, and a readable success green.

## Scope

### In scope

- Tags `Search tags…` input as a full-width row below the `Tags` title, with clear-focus action retained
- Tag row label/meta reserving their own space with action buttons below and no overlap
- `.manager__header-row` fixed min-height so Nodes/Edges `Filter…` rows align
- Tag-edit helper close under the input with small gap before Save, scoped to the tag-edit section
- Darker helper-scoped success green for `Available`

### Out of scope

- Changing tag charset, validation, rename, focus, delete, or ordering
- Session/selection changes
- Empty-state illustrations
- Global success color token

## Domain rules

- Presentation-only; no `src/lib/graph/**` rule changes.
- All existing `data-testid` hooks, aria labels, filtering, validation, and focus semantics stay intact.

## Acceptance scenarios

### Scenario: Search below title

- **Given** the Tags tool is open
- **When** the panel is displayed
- **Then** one search input appears in a full-width row below the `Tags` title, not beside it
- **And** typing filters tags and clear-focus still works

### Scenario: No row overlap

- **Given** tag rows are visible
- **When** the panel is displayed at default density
- **Then** label + `N Nodes · M Edges` do not visually overlap the Show-only / focus / delete buttons
- **And** clicking non-action card area opens the editor while row actions stay independent

### Scenario: Headers align

- **Given** the Nodes and Edges tools
- **When** each panel is displayed
- **Then** their header rows measure equal height and the `Filter…` fields align vertically

### Scenario: Helper spacing

- **Given** the tag rename editor is open
- **When** the helper is displayed
- **Then** it sits close beneath the input with little trailing space before Save

### Scenario: Success green

- **Given** a valid unused rename draft
- **When** the helper shows `Available`
- **Then** it renders in the darker helper-scoped success green, not `#2f9e8a`

## Traceability

- Domain/app tests: none (presentation-only slice)
- E2E: `e2e/tags-tool.e2e.ts` (`SPEC-051 manager layout polish` + updated helper-margin assertions)
- Implementation: `src/lib/ui/ManagerPanel.svelte` (Tags header rows, tag rows, header min-height, tag-edit spacing/color)
