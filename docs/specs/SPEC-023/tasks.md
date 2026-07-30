# SPEC-023 — Tasks

## Tasks

- [ ] **T1** — Domain types/ops + failing unit tests
  - Red: failing tests for ITEM-023 acceptance
  - Green: domain API sketched
  - Notes: `src/lib/graph`

- [ ] **T2** — Implement domain behavior to green
  - Red: remaining failing domain tests
  - Green: all domain tests pass; coverage fence held
  - Notes: `src/lib/graph`

- [ ] **T3** — Wire UI / session / world as needed
  - Red: component or integration behavior tests
  - Green: manager/world reflect domain
  - Notes: `src/lib/ui`, `session`, `world`

- [ ] **T4** — Playwright: critical user path for Import / export JSON
  - Red: e2e fails before feature
  - Green: e2e passes
  - Notes: `e2e/`

## Done when

- [ ] All acceptance criteria in spec.md checked
- [ ] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [ ] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
