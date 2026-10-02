# Spec: Illustrated empty states

- **ID:** 053
- **Status:** Accepted
- **Item:** ITEM-058
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

Every manager list tool shows a helpful illustrated empty view instead of blank space or bare text.

## Scope

### In scope

- Nodes: truly-empty vs filter-no-match empty views
- Edges: truly-empty vs filter-no-match empty views
- Tags: `No tags yet` vs `No tags match` illustrated views (keep copy distinction)
- Groups: `No groups yet` illustrated view (owner confirmed in v1)
- Shared icon + title + hint structure reusing existing line-icon style

### Out of scope

- Changing filtering, selection, focus, or list behavior
- New asset pipeline, animations, or sounds
- Layout changes owned by SPEC-051

## Domain rules

- Presentation-only; no `src/lib/graph/**` changes.
- Icons are decorative (`aria-hidden`); meaning lives in text.
- Existing `data-testid` hooks for lists stay; add testids for empty views.

## Acceptance scenarios

### Scenario: Nodes empty

- **Given** the document has no nodes
- **When** the Nodes tool is open
- **Then** an illustrated empty view with icon, title, and hint is shown

### Scenario: Nodes no match

- **Given** nodes exist but the filter matches none
- **When** the Nodes filter is applied
- **Then** a distinct no-match hint is shown with icon

### Scenario: Edges empty and no match

- **Given** the Edges tool is open with no edges, then with edges but no filter match
- **When** each state is displayed
- **Then** the matching illustrated empty / no-match views appear

### Scenario: Tags and Groups

- **Given** no tags / no tag match / no groups
- **When** each tool is open
- **Then** illustrated views appear, preserving the `No tags yet` vs `No tags match` copy

## Traceability

- Domain/app tests: none (presentation-only slice; filter semantics covered by existing `src/lib/graph/search/*ListFilter.test.ts`)
- E2E: `e2e/empty-states.e2e.ts` (SPEC-053 empty + no-match for Nodes/Edges/Tags/Groups; both failed Red before implementation)
- Implementation: `src/lib/ui/ManagerPanel.svelte` (`emptyView` snippet, per-tool empty/no-match branches, `.empty-view` styles)
