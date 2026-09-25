# SPEC-043 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for Labels, colors, edge geometry
  - Red: N/A (docs)
  - Green: ITEM-043 + SPEC-043 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: world-config asserts colors/distances; edge-pose.test.ts; node-sphere.test.ts
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: Covered indirectly via world smoke; no dedicated visual regression
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
