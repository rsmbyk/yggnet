# SPEC-041 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for Camera chrome + 2D/3D
  - Red: N/A (docs)
  - Green: ITEM-041 + SPEC-041 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: camera-fit.test.ts; WORLD.controls.viewModeTransitionMs documented
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: camera-view.e2e.ts: toggle 2D/3D and reset controls visible
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
