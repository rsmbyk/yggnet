# SPEC-046 — Plan

## Approach

Formalize ITEM-046 (Manager Nodes/Edges list UX) from the vibe reference branch: document acceptance criteria, lock with characterization tests, avoid feature rewrites.

## Architecture touchpoints

- `src/lib/graph/**` — domain helpers if this SPEC touches lists/filters
- `src/lib/session/**` — mode / camera / selection UI state
- `src/lib/ui/**` — manager chrome
- `src/lib/world/**` — Threlte world
- Feature area: **manager**

## File / area checklist

- `src/lib/ui/ManagerPanel.svelte`
- `src/lib/ui/TagPicker.svelte`
- `src/lib/graph/search/nodeListFilter.ts`
- `src/lib/graph/search/edgeListFilter.ts`

## TDD sequence

1. Red: characterization tests from acceptance criteria (where coverage missing)
2. Green: without changing product behavior (except SPEC-040 intentional deltas)
3. Playwright path for the primary user-visible flow

## Playwright plan

- manager-edges.e2e.ts: open Edges tool; filter field present

## Migration / compatibility

- No document schema change required for this SPEC.

## Rollout

- Branch: `vibe/session-20260730` (formalization in place)
- PR target: `develop` (draft PR 16)
- Expected bump: **minor**

## Risks & mitigations

- Accidental rewrite while “cleaning up” — characterization tests must stay green without product diffs
