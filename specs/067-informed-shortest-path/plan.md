# Plan 067: Informed point-to-point shortest paths

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-075
- **Bump:** minor

## Why

A* and Bidirectional Dijkstra let Analyze compare two optimal point-to-point strategies while
keeping the existing graph's arbitrary non-negative weights honest.

## Approach

Add Search-only definitions. A* uses `scale × straight-line distance`: `scale` is the minimum
finite `weight / geometric edge length` over all non-negative, nonzero-length edges, or zero when
no such safe scale exists. This lower bound is admissible by the triangle inequality, so A* remains
optimal; zero simply behaves like Dijkstra. Its helper text explains this plainly. Bidirectional
Dijkstra expands legal outgoing Start arcs and legal incoming Target arcs with a sound frontier
bound, then joins a deterministic best meeting path.

## TDD and delivery

Test heuristic admissibility/fallback, non-negative eligibility, directed reverse expansion,
ties, stopping bounds, meeting reconstruction, and Trace inspectors. Deliver in one independent
`feat/067-informed-shortest-path` PR.
