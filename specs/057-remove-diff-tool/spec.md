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

- Implementation: PR [#32](https://github.com/rsmbyk/yggnet/pull/32), merged 2026-09-26; removed the state from `src/lib/session/app.svelte.ts`, the UI/panel from `src/lib/ui/ManagerPanel.svelte`, the toolbar entry from `src/lib/ui/Toolbar.svelte`, and the tool ID from `src/lib/ui/tool-ids.ts`.
- Verification: repository search for `diffIds`, `setDiffIds`, and `pushDiff` confirms no active `src/` or `e2e/` consumers; `npm run test:coverage` and `npm run test:e2e` pass in this remediation PR.
- E2E: Diff-specific coverage was removed with the tool; the full Playwright suite verifies the remaining toolbar, panel, and overlay flows.
- Historical release evidence: ITEM-065 records PR #32 and release version `0.38.0`.
