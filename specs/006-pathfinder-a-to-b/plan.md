# SPEC-006 — Plan

## Approach

Deliver ITEM-006 (Pathfinder A to B) end-to-end: domain first (TDD), then session/UI/world adapters, then Playwright.

## Architecture touchpoints

- `src/lib/graph/**` — domain
- `src/lib/session/**` — mode / UI state if needed
- `src/lib/ui/**` — manager chrome
- `src/lib/world/**` — Threlte
- Feature area: **directions**

## File / area checklist

- graph domain modules for this feature
- UI and/or world wiring
- e2e coverage

## TDD sequence

1. Red: domain tests from acceptance criteria
2. Green: implement domain
3. Wire UI/world
4. Playwright path

## Playwright plan

- Cover the main happy path described in acceptance criteria for ITEM-006.

## Migration / compatibility

- Preserve `schemaVersion` compatibility; default new fields when reading older documents if applicable.

## Rollout

- Branch: `feat/SPEC-006-short-slug`
- PR target: `develop`
- Expected bump: **minor**

## Risks & mitigations

- Path explosion — enforce max results/depth
