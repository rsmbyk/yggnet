# Spec: Remove Groups, autotag Group-N

- **ID:** 056
- **Status:** Done
- **Item:** ITEM-064
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** major

## Intent

Exactly one grouping vocabulary (Tags). Structural groups disappear; the Group button becomes a one-click shared-tagger with collision-free monotonic numbering.

## Scope

### In scope

- Delete Groups tool, panel, session/world group machinery, `groupId`, groups E2E; deprecate SPEC-016
- `Group-N` autotag on the Nodes multi-select Group button with persistent counter
- Legacy `groupId` tolerance on import

### Out of scope

- Tag model/validation changes
- Any collapse replacement

## Domain rules

- Counter `groupTagCounter` (name locked at Accept) lives on the document, starts at 0, increments per Group-button use, persists through save/load, and participates in undo history as part of doc snapshots.
- Candidate N = ++counter; while `Group-N` exists anywhere in the doc, increment again. Numbers are never reused.
- Autotag targets the selected nodes only, never edges.
- Rename/delete of `Group-N` tags are plain tag ops with no structural effects.

## Acceptance scenarios

### Scenario: Groups gone

- **Given** any app state
- **When** the toolbar and panels render
- **Then** no Groups tool, section, collapse, or ungroup affordance exists

### Scenario: Autotag numbering

- **Given** a fresh document
- **When** the user groups two selections in sequence
- **Then** members carry `Group-1` then `Group-2`, and the counter survives save/load

### Scenario: Collision skip

- **Given** a hand-made `Group-2` tag exists and the counter is at 1
- **When** the Group button is used
- **Then** the new tag is `Group-3`, not a merge into `Group-2`

### Scenario: No reuse

- **Given** `Group-1` was created then its tag deleted
- **When** the Group button is used again
- **Then** the new tag is `Group-2`, never `Group-1` again

### Scenario: Legacy import

- **Given** a saved document containing `groupId` fields
- **When** it is imported
- **Then** it opens without error and the stale fields are dropped

## Traceability

- Domain/app tests:
- E2E:
- Implementation:
