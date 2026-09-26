# SPEC-048 — Tasks

## Tasks

- [x] **T1** — Add Edges list ordering acceptance coverage
  - Red: `e2e/manager-edges.e2e.ts` asserts primary and secondary endpoint-label order and filtering preserves the matching edge set
- [x] **T2** — Sort visible Edges rows
  - Green: derive sorted display rows after filtering without mutating document edges
- [x] **T3** — Verify filtering and project checks
  - Full unit/coverage suite, Playwright suite, build, Svelte/type checks, formatting, and changed-file lint pass

## Done when

- [x] All SPEC-048 acceptance scenarios pass
- [x] `e2e/manager-edges.e2e.ts` passes
- [x] Board / ITEM status and version records are complete for the PR
