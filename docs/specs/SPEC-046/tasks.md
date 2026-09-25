# SPEC-046 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for Manager Nodes/Edges list UX
  - Red: N/A (docs)
  - Green: ITEM-046 + SPEC-046 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: nodeListFilter.test.ts; edgeListFilter.test.ts
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: manager-edges.e2e.ts: open Edges tool; filter field present
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
