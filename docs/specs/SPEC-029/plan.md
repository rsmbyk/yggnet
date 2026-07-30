# SPEC-029 — Plan

## Approach

Deliver ITEM-029 (Multi-select nodes (and edges)) end-to-end: domain first (TDD), then session/UI/world adapters, then Playwright.

## Architecture touchpoints

- `src/lib/graph/**` — domain
- `src/lib/session/**` — mode / UI state if needed
- `src/lib/ui/**` — manager chrome
- `src/lib/world/**` — Threlte
- Feature area: **world**

## File / area checklist

- graph domain modules for this feature (if applicable)
- UI and/or world wiring
- e2e coverage

## TDD sequence

1. Red: domain tests from acceptance criteria
2. Green: implement domain
3. Wire UI/world
4. Playwright path

## Playwright plan

- Cover the main happy path described in acceptance criteria for ITEM-029.

## Migration / compatibility

- Preserve `schemaVersion` compatibility; default new fields when reading older documents if applicable.

## Rollout

- Branch: `feat/SPEC-029-multi-select`
- PR target: `develop`
- Expected bump: **minor**
- Suggested order: SPEC-029 before SPEC-030; SPEC-032 before or with SPEC-033; SPEC-034/035 can parallelize after Analyze shell; SPEC-036 after runs/annotate APIs; SPEC-037/038 manager-side

## Risks & mitigations

- Edit panel ambiguity when many selected — show count / primary
- Re-render loops on large sets
