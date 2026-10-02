# SPEC-039 — Tasks

## Tasks

- [x] **T1** — Spec pack + ITEM for World-first shell + HUD
  - Red: N/A (docs)
  - Green: ITEM-039 + SPEC-039 pack authored from vibe behavior
  - Notes: formalization of existing code

- [x] **T2** — Characterization / unit coverage
  - Red: missing asserts for acceptance criteria
  - Green: hud-layout unit tests remain green
  - Notes: no product rewrite

- [x] **T3** — Playwright: primary flow
  - Red: missing e2e for acceptance
  - Green: shell.e2e.ts: world + HUD visible; world-tune controls absent; too-small overlay
  - Notes:

## Done when

- [x] All acceptance criteria in spec.md checked
- [x] `src/lib/graph/**` coverage bar still met (if this SPEC touches core)
- [x] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
