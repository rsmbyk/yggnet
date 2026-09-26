# SPEC-050 — Tasks

## Tasks

- [x] **T1** — Add combined Tags tool acceptance coverage
  - Red: `e2e/tags-tool.e2e.ts` covers helper guidance/spacing, full non-action row target, independent actions, tag-specific editor header, and header search placement/styling/filtering
- [x] **T2** — Implement the Tags tool UX polish
  - Green: apply the accepted SPEC-050 changes in `src/lib/ui/ManagerPanel.svelte` without changing tag domain behavior
- [x] **T3** — Verify Tags tool behavior
  - Run `e2e/tags-tool.e2e.ts`, full unit/coverage suite, full Playwright suite, build, and Svelte/type checks

## Done when

- [x] All SPEC-050 acceptance scenarios pass
- [x] Existing tag validation, focus, delete, rename, and filtering behavior remains intact
- [x] All linked ITEMs and version records are complete for the PR
