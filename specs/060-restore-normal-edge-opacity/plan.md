# Plan 060: Restore normal edge opacity

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-068
- **Bump:** patch

## Why

SPEC-058 moved non-matching edges into a genuinely transparent mesh, but its partition treats an empty overlay match set as if every edge were a non-match. The normal world state therefore renders all edge shafts and arrowheads at the dimmed opacity.

## Scope / edges

**In:**

- Make edge bucket selection conditional on the existing active-dimming signal, not match-set membership alone
- Keep all visible edges in the opaque bucket when no dimming overlay is active
- Preserve transparent rendering for non-matching edges while tag focus or another dimming overlay is active
- Add a pure renderer-level regression test for normal, focused, and cleared states

**Out:**

- Changing the dimmed opacity value
- Node, label, selection, edge color, or edge geometry changes
- Overlay/session synchronization changes
- Custom shaders or mesh architecture changes

## Approach

Extract the edge partition decision into a small pure world-renderer helper. Feed it the visible edges, overlay edge IDs, and the existing `dimOthers` state. `GraphScene.svelte` will use the returned opaque and dimmed buckets for both shafts and arrowheads.

## TDD

- Proposed seam for owner confirmation: public pure edge-partition helper under `src/lib/world/`, covered by a colocated Vitest test
- Red: prove no-overlay and cleared-overlay states put every edge in the opaque bucket; prove active focus splits matches from non-matches
- Green: wire the helper into `GraphScene.svelte`
- E2E: keep the existing Tags focus flow green; no pixel-sensitive assertion is planned because WebGL material opacity is not a stable DOM seam

## Risks

- Other overlays also use `dimOthers`; the helper must preserve their current match/dim behavior.
- Shaft and arrowhead buckets must continue to share the same partition.
