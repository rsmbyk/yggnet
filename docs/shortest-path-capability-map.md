# Shortest-path capability map

**Status:** Owner-approved direction; implementation remains gated by the Draft spec packs below.

| Module                  | Algorithms                 | Core constraint                                                      | Draft spec                                                     |
| ----------------------- | -------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------- |
| Binary-weight paths     | 0–1 BFS                    | Every edge weight is exactly 0 or 1                                  | [SPEC-064](../specs/064-binary-weight-shortest-path/spec.md)   |
| Negative-weight paths   | Bellman–Ford               | Negative cycles that can affect the target make the result undefined | [SPEC-065](../specs/065-negative-weight-shortest-path/spec.md) |
| Acyclic paths           | DAG shortest path          | Graph must contain directed edges only and be acyclic                | [SPEC-066](../specs/066-dag-shortest-path/spec.md)             |
| Informed point-to-point | A*, Bidirectional Dijkstra | Non-negative edge weights                                            | [SPEC-067](../specs/067-informed-shortest-path/spec.md)        |

## Delivery order

1. Binary-weight paths
2. Negative-weight paths
3. Acyclic paths
4. Informed point-to-point paths

Each module has its own branch and PR after its Draft pack is accepted. All retain the existing
Analyze generated form, Result, Trace, inspectors, and shared reveal language.
