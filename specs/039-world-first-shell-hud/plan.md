# SPEC-039 — Plan

## Approach

Formalize ITEM-039 (World-first shell + HUD) from the vibe reference branch: document acceptance criteria, lock with characterization tests, avoid feature rewrites.

## Architecture touchpoints

- `src/lib/graph/**` — domain helpers if this SPEC touches lists/filters
- `src/lib/session/**` — mode / camera / selection UI state
- `src/lib/ui/**` — manager chrome
- `src/lib/world/**` — Threlte world
- Feature area: **world**

## File / area checklist

- `src/routes/+page.svelte`
- `src/lib/world/WorldHud.svelte`
- `src/lib/world/WorldCanvas.svelte`
- `e2e/shell.e2e.ts`

## TDD sequence

1. Red: characterization tests from acceptance criteria (where coverage missing)
2. Green: without changing product behavior (except SPEC-040 intentional deltas)
3. Playwright path for the primary user-visible flow

## Playwright plan

- shell.e2e.ts: world + HUD visible; world-tune controls absent; too-small overlay

## Migration / compatibility

- No document schema change required for this SPEC.

## Rollout

- Branch: `vibe/session-20260730` (formalization in place)
- PR target: `develop` (draft PR 16)
- Expected bump: **minor**

## Risks & mitigations

- Accidental rewrite while “cleaning up” — characterization tests must stay green without product diffs
