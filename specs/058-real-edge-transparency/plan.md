# Plan 058: Real edge transparency

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-066
- **Bump:** patch

## Why

Dimmed edges fake opacity by lerping instance color toward the background, which re-lights wrong under the lit shaft material — non-matching edges look solid during tag focus while nodes fade properly.

## Scope / edges

**In:**

- Split-bucket instanced edges: matches opaque, non-matches in a `transparent` low-opacity `depthWrite`-off mesh; same for arrow heads
- Removal of the edge `instanceTint` bg-lerp (keep the helper only if used elsewhere)
- Pure partition helper under `src/lib/world/` with unit tests

**Out:**

- Overlay state semantics (sync/clear untouched)
- Node/label rendering changes
- Custom shaders

## Approach

Extract the match/dim partition as a pure function first (Red/Green at unit level), then rewire `syncInstancedEdges` capacity/attach logic for two meshes, then Playwright overlay-state coverage. Watch z-ordering between dimmed edges, matches, nodes, and labels.

## TDD

- Domain/app tests: partition helper unit tests (match set, dim set, empty/full focus edge cases)
- E2E: existing overlay-state coverage stays green (pixels not asserted)

## Risks

- Transparent-mesh draw order artifacts (mitigated by `depthWrite: false` + faint opacity).
- Doubled capacity bookkeeping for shafts and arrows must stay in sync.
