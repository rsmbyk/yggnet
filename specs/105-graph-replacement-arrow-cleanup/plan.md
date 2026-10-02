# Plan 105: Graph replacement arrow cleanup

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-113
- **Bump:** patch

## Why

After replacing or regenerating a graph, direction-cone visuals from a previous directed graph can
remain visible and appear to connect nodes in the new graph. Renderer decorations must track the
current graph lifecycle.

## Scope / edges

**In:** cleanup and synchronization of directed-edge arrowhead/cone visuals on graph replacement.

**Out:** changing directed-edge geometry, arrow appearance, graph generation semantics, or unrelated
renderer decoration lifecycle.

## Approach

Trace the current graph identity through edge/arrow rendering, reproduce graph replacement with
directed and undirected documents, and ensure arrowhead instances are derived only from the active
edge set.

## TDD

- World tests: existing GraphScene/world rendering tests or a focused graph-replacement lifecycle
  test.
- E2E: graph generation flow in `e2e/generate-form.e2e.ts`.

## Risks

- Cleanup must not remove cones for valid directed edges in the newly active graph or create stale
  instances during fast consecutive replacements.
