# SPEC-040 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for Canonical world config
  - Red: N/A (docs)
  - Green: ITEM-040 + SPEC-040 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: world-config.test.ts locks textureSize, groundSize, camera helper, doc sync
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: shell.e2e.ts asserts world-tune controls absent
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
