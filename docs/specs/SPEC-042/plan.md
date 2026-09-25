# SPEC-042 — Plan

## Approach

Formalize ITEM-042 (Solid nodes + pointer intents) from the vibe reference branch: document acceptance criteria, lock with characterization tests, avoid feature rewrites.

## Architecture touchpoints

- `src/lib/graph/**` — domain helpers if this SPEC touches lists/filters
- `src/lib/session/**` — mode / camera / selection UI state
- `src/lib/ui/**` — manager chrome
- `src/lib/world/**` — Threlte world
- Feature area: **world**

## File / area checklist

- `src/lib/world/node-physics.ts`
- `src/lib/world/node-click.ts`
- `src/lib/world/GraphScene.svelte`

## TDD sequence

1. Red: characterization tests from acceptance criteria (where coverage missing)
2. Green: without changing product behavior (except SPEC-040 intentional deltas)
3. Playwright path for the primary user-visible flow

## Playwright plan

- world-intents.e2e.ts: add node; connect banner cancel with Escape

## Migration / compatibility

- No document schema change required for this SPEC.

## Rollout

- Branch: `vibe/session-20260730` (formalization in place)
- PR target: `develop` (draft PR 16)
- Expected bump: **minor**

## Risks & mitigations

- Accidental rewrite while “cleaning up” — characterization tests must stay green without product diffs
