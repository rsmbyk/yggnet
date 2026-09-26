# Spec: Remove Diff tool

- **ID:** 057
- **Status:** Accepted
- **Item:** ITEM-065
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

Delete the Diff tool completely: no toolbar entry, no panel, no session state, SPEC-018 Deprecated.

## Scope

### In scope

- Toolbar `diff` entry and icon path removal
- Diff panel section removal
- `diffIds` state, `setDiffIds`, `pushDiff`, and all call sites removed
- Diff E2E removed or repurposed; SPEC-018 Deprecated

### Out of scope

- Compare/analyze behavior changes
- Any new comparison UI

## Domain rules

- No document-model change in this slice.
- After this slice, `diffIds` (any casing) appears nowhere in `src/`, `e2e/`, or docs except historical changelogs.

## Acceptance scenarios

### Scenario: Diff gone

- **Given** any app state
- **When** the toolbar and panels render
- **Then** no Diff tool, section, or affordance exists

### Scenario: No dangling state

- **Given** the codebase after the change
- **When** searching for `diffIds`/`setDiffIds`/`pushDiff`
- **Then** there are zero matches outside changelogs and the Deprecated SPEC-018

### Scenario: Neighbors intact

- **Given** the remaining tools and overlays
- **When** their suites run
- **Then** everything unrelated stays green

## Traceability

- Domain/app tests:
- E2E:
- Implementation:
