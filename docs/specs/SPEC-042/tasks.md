# SPEC-042 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for Solid nodes + pointer intents
  - Red: N/A (docs)
  - Green: ITEM-042 + SPEC-042 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: node-physics.test.ts; node-click.test.ts
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: world-intents.e2e.ts: add node; connect banner cancel with Escape
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
