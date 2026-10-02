---
id: SPEC-103
item: ITEM-111
type: fix
feature_area: analyze
bump: patch
status: Accepted
title: 'Analyze result presentation and artifact hierarchy'
created: 2026-10-02
updated: 2026-10-02
---

# Spec: Analyze result presentation and artifact hierarchy

- **Status:** Accepted

## Intent

Make Analyze results fit the available panel space, easier to scan, and more accessible without
changing algorithm results or reveal/trace behavior.

## Scope

**In:** Tab separator; grow-then-scroll panel body; collapsed-by-default data structures with state
retained for the current run; improved card spacing; named grouped sections; accessible tables for
map-like and ranking artifacts; inline coloring palette legend; readable and distinct No result and
Rejected states.

**Out:** Analysis computation, artifact values, animation timing, graph decorations, or new artifact
types.

## Rules

- A visible separator follows the Result/Trace tabs and precedes the active view, matching the
  existing separator treatment before legends.
- The panel grows up to the available viewport height. Once constrained, only its content body
  scrolls; the panel header, Result/Trace tabs, and active legend remain visible and do not overlap
  the body.
- Expandable data-structure artifacts start collapsed for a newly completed analysis run. Their
  open/closed state persists when switching Result/Trace or hiding and reopening the panel during
  that same run. A new run or cleared result resets each artifact to collapsed. Non-expandable
  scalar metrics remain immediately visible.
- Data-structure cards have enough vertical separation to read as distinct groups, consistent with
  spacing between other result metrics.
- A grouped artifact (including components and color classes) shows each group name as a subheading,
  followed by its count where applicable and a separate member list. It must not flatten all groups
  into one bulleted line per group.
- Map-like artifacts use semantic tables with accessible column headers. Ranking artifacts use a
  semantic table with rank, item, and score/value columns. Tables remain usable on narrow panels
  without clipping content; horizontal scrolling may be local to a wide table.
- Color-class artifacts show a labeled swatch for each class in that artifact. Stable renderer-owned
  palette colors may reinforce the class, but labels and membership text remain understandable
  without color.
- **No result** (eligible input with no solution) and **Rejected** (input violates preconditions) use
  distinct backgrounds and accessible descriptions. Both use readable foreground/background
  contrast of at least 4.5:1 for normal-size text, with the reason kept visible.

## Acceptance scenarios

### Scenario: Use the panel in a constrained viewport

**Given** result content exceeds the available viewport height
**When** the user scrolls the result body
**Then** the panel grows only to available height, the body alone scrolls, and tabs and legend stay
visible with a separator below the tabs.

### Scenario: Keep data structures collapsed within one run

**Given** a completed run with expandable result artifacts
**When** the user opens one artifact, switches views, and returns during the same run
**Then** the disclosure state is retained; when a new run completes, all expandable artifacts start
collapsed.

### Scenario: Read grouped memberships

**Given** an analysis result contains multiple components or color classes
**When** its data structure is expanded
**Then** each group name is a subheading followed by its members, and color classes also show a
labeled palette swatch.

### Scenario: Read maps and rankings

**Given** an analysis result contains map-like values or a ranking
**When** the artifact is expanded
**Then** it is presented as a semantic table with meaningful headers and all values accessible.

### Scenario: Distinguish unsuccessful and rejected runs

**Given** one eligible graph has no solution and another graph violates algorithm preconditions
**When** each result is shown
**Then** No result and Rejected have distinct, high-contrast visual treatments and readable reason
text.

## Traceability

- Domain/app tests: result panel component/policy tests for artifact presentation and state lifecycle.
- E2E: `e2e/analyze-laboratory.e2e.ts`.
- Implementation: pending Draft acceptance.
