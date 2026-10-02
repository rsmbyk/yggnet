# Plan 068: Connectivity region analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-076
- **Bump:** minor

## Why

Analyze needs to expose the graph's disconnected regions using the right meaning of direction.

## Approach

Add fieldless definitions for connected components, weak components, and strongly connected
components. Connected Components rejects any directed edge; Weak Components ignores arrow direction;
Strong Components treats an undirected edge as two legal arcs. Produce ordered `partition` artifacts,
generic events/reveal phases, and renderer-owned stable component roles/colors with textual membership.

## TDD and delivery

Test deterministic traversal, isolated nodes, mixed directions, weak versus strong distinctions,
and clone-safe results before UI/world/E2E coverage. Deliver independently on
`feat/068-connectivity-regions`.
