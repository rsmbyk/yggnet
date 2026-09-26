# Spec: Nodes keyword filter

- **ID:** 055
- **Status:** Accepted
- **Item:** ITEM-063
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

Replace exact-node chips with a single keyword pill so users can find nodes by label substring, while tags keep covering vocabulary filtering.

## Scope

### In scope

- Nodes dropdown: tag suggestions only + `Search "<text>"` row while typing
- One keyword pill: first position, distinct color, replaces any previous keyword
- Label substring match (case-insensitive) ANDed with tag chips
- Prefill on dropdown open; Backspace-on-empty and × clear
- Removal of Nodes exact-node chip state and its UI

### Out of scope

- Edges endpoint filtering
- Tag charset/validation or TagPicker changes
- Persisting the keyword beyond the session (unless filters already persist — lock at Accept)

## Domain rules

- `nodeMatchesListFilter(node, tags, keyword)`: empty keyword constrains nothing; otherwise the node label must contain the keyword (case-insensitive) AND the existing tag rule must hold.
- At most one keyword; creating replaces; clearing removes the constraint entirely.

## Acceptance scenarios

### Scenario: Create keyword pill

- **Given** the Nodes tool is open on a document with nodes
- **When** the user types text and activates the `Search "<text>"` row
- **Then** one keyword pill appears first with a distinct color and the list shows only label matches

### Scenario: Replace and clear

- **Given** a keyword pill is set
- **When** the user creates another keyword, presses Backspace on empty input, or clicks the pill ×
- **Then** the pill is replaced or removed and the list updates accordingly

### Scenario: Prefill

- **Given** a keyword pill is set and the dropdown is closed
- **When** the user reopens the Nodes filter dropdown
- **Then** the search field is prefilled with the keyword

### Scenario: Tags combine

- **Given** tag chips and a keyword are both set
- **When** the list renders
- **Then** only nodes matching a tag AND the keyword appear

### Scenario: Edges untouched

- **Given** the Edges tool filter
- **When** it is used
- **Then** endpoint-node chips still work as before

## Traceability

- Domain/app tests: `src/lib/graph/search/nodeListFilter.test.ts` (empty/tags/keyword/AND cases, Red→Green)
- E2E: `e2e/tags-tool.e2e.ts` (SPEC-055 keyword create/filter/prefill/replace/Backspace/Enter + updated optgroup test); `e2e/empty-states.e2e.ts` nodes-no-match simplified to the keyword pill
- Implementation: `src/lib/graph/search/nodeListFilter.ts` (new signature), `src/lib/ui/ManagerPanel.svelte` (tags-only suggestions, keyword pill, prefill, Enter/Backspace)
