# SPEC-045 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for Toolbar + tools panel chrome
  - Red: N/A (docs)
  - Green: ITEM-045 + SPEC-045 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: tool-ids.test.ts; tools-panel-limit.test.ts; forward-wheel.test.ts
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: tools-panel-height.e2e.ts; shell opens toolbar
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
