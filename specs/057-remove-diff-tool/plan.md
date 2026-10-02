# Plan 057: Remove Diff tool

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-065
- **Bump:** minor

## Why

Owner decision: the Diff tool goes away with no replacement. `diffIds` is UI-only state, so this is a minor removal.

## Scope / edges

**In:**

- Remove Diff toolbar entry, panel section, `diffIds` session state and actions, related E2E; SPEC-018 Deprecated
- Consumer inventory: prove nothing else (compare/analyze/overlays) depends on `diffIds`

**Out:**

- Any replacement comparison UI
- Changes to compare/analyze behavior

## Approach

Inventory `diffIds` consumers first (session, UI, world, tests, docs), then delete UI + state + E2E in one slice. Small enough for a single Red/Green pass driven by type errors + E2E.

## TDD

- Domain/app tests: removal-driven (failing references first, then delete); keep/extend session tests that touch neighboring selection state
- E2E: delete/repurpose diff coverage; neighbors (toolbar/panel presence) stay green

## Risks

- Hidden `diffIds` consumers (e.g. overlay locks, analyze flows) — the inventory is the load-bearing step.
