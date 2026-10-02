# Spec: Panel header row polish

- **ID:** 054
- **Status:** Accepted
- **Items:**
  - ITEM-061
  - ITEM-062
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** patch

## Intent

Tighten the manager header-to-content spacing and make the whole tag card the editor target, without changing behavior or regressing the SPEC-051 layout fixes.

## Scope

### In scope

- Reduced `.manager` header↔body gap and search/filter top margins (panel-wide unless Accept says Tags-scoped)
- Tag row grid-stretch: `row-main` spans the card, label pinned top, actions in their own row above it
- Whole-card click activation and whole-card focus ring

### Out of scope

- Filtering, focus, selection, or validation semantics
- Other tools' layout beyond the shared panel gap

## Domain rules

- Presentation-only; no `src/lib/graph/**` changes.
- ITEM-057 header alignment and ITEM-051 activation/independence/focus rules keep holding.

## Acceptance scenarios

### Scenario: Tighter header gap

- **Given** the Tags, Nodes, Edges, and tag-edit panels
- **When** each is displayed
- **Then** the header-row-bottom → content-top distance is smaller than the recorded before-values
- **And** Nodes vs Edges header/filter alignment stays equal

### Scenario: Whole-card target

- **Given** tag rows are visible
- **When** the user clicks anywhere on a card outside the three action buttons
- **Then** that tag's editor opens
- **And** keyboard focus rings the whole card

### Scenario: Actions unaffected

- **Given** tag rows are visible
- **When** the user activates Show only, focus toggle, or delete
- **Then** only that action occurs and the editor does not open
- **And** label/meta never visually overlap the buttons

## Traceability

- Domain/app tests: none (presentation-only slice)
- E2E: `e2e/tags-tool.e2e.ts` (`SPEC-054 panel header row polish` Red→Green; SPEC-051 assertions updated for the `:focus-within` whole-card ring and label-click activation)
- Implementation: `src/lib/ui/ManagerPanel.svelte` (panel/search gaps, row click-catcher, focus-within ring, actions pointer-events split)
