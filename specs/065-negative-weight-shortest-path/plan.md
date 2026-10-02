# Plan 065: Negative-weight shortest path

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-073
- **Bump:** minor

## Why

Bellman–Ford makes negative edge costs inspectable without claiming a result that a relevant
negative cycle renders undefined.

## Approach

Relax deterministic legal arcs for at most `|V|-1` rounds, stopping early on an unchanged round.
Afterward, detect relaxable nodes reachable from Start and determine whether they can reach Target;
only then does a negative cycle invalidate this Start-to-Target query. Surface rounds, changes,
distances, predecessors, and the affected-cycle explanation through existing Analyze contracts.

## TDD and delivery

Test finite negative paths, directed and undirected arcs, irrelevant versus target-affecting
negative cycles, ties, and no path before UI/E2E integration. Deliver independently on
`feat/065-negative-weight-shortest-path`.
