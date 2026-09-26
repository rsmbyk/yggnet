# Plan 055: Nodes keyword filter

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-063
- **Bump:** minor

## Why

Exact-node chips in the Nodes filter show precisely the chipped node — nearly useless for finding nodes. A label-substring keyword pill is the useful primitive; tags keep covering vocabulary filtering. Edges keeps endpoint chips (edges-touching-X stays meaningful).

## Scope / edges

**In:**

- Tags-only suggestions in the Nodes dropdown plus a `Search "<text>"` row while typing
- Single replaceable keyword pill (first, distinct color): substring label match ANDed with tag chips; prefill on open; Backspace/× clear
- `nodeMatchesListFilter` keyword parameter; removal of Nodes `nodeSearchNodeIds` state

**Out:**

- Edges filter behavior
- Tag model, charset, or TagPicker behavior
- Changing OR semantics between the keyword and tag chips (keyword AND tags)

## Approach

Domain first (`src/lib/graph/search/nodeListFilter.ts` + tests), then session/UI state in `src/lib/session/app.svelte.ts` (if the chip state lives there) and `src/lib/ui/ManagerPanel.svelte`, then Playwright. Update SPEC-050 Nodes-optgroup assertions in-slice.

## TDD

- Domain/app tests: `src/lib/graph/search/nodeListFilter.test.ts` (keyword match, case-insensitivity, AND with tags, empty keyword)
- E2E: Nodes filter keyword flow in a Playwright test (create pill, filter, prefill, replace, clear)

## Risks

- Chips stored in saved UI state or URLs would go stale; check for persisted filter state at Draft time.
- Session tests covering `nodeSearchNodeIds` (if any) need updating alongside.
