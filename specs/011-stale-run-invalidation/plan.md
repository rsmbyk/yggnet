# SPEC-011 — Plan

## Approach

Deliver ITEM-011 (Stale-run invalidation) end-to-end: domain first (TDD), then session/UI/world adapters, then Playwright.

## Architecture touchpoints

- `src/lib/graph/**` — domain
- `src/lib/session/**` — mode / UI state if needed
- `src/lib/ui/**` — manager chrome
- `src/lib/world/**` — Threlte
- Feature area: **analyze**

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

- Cover the main happy path described in acceptance criteria for ITEM-011.

## Migration / compatibility

- Preserve `schemaVersion` compatibility; default new fields when reading older documents if applicable.

## Rollout

- Branch: `feat/SPEC-011-short-slug`
- PR target: `develop`
- Expected bump: **patch**

## Risks & mitigations

- Which mutations count — define set
