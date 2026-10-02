# Analyze extension capability map

**Status:** Owner-approved module boundaries and build order; implementation remains gated by the
Draft spec packs below.

| Module                        | Responsibility                                      | Depends on       | Draft spec                                                             |
| ----------------------------- | --------------------------------------------------- | ---------------- | ---------------------------------------------------------------------- |
| `community-louvain`           | Weighted modularity-based community partition       | —                | [SPEC-093](../specs/093-louvain-community-detection/spec.md)           |
| `community-label-propagation` | Deterministic label propagation community partition | —                | [SPEC-094](../specs/094-label-propagation-community-detection/spec.md) |
| `traveling-salesman`          | Exact minimum-cost Hamiltonian circuit              | —                | [SPEC-095](../specs/095-traveling-salesman/spec.md)                    |
| `chinese-postman`             | Minimum-cost closed walk covering every stored edge | —                | [SPEC-096](../specs/096-chinese-postman/spec.md)                       |
| `planarity-test`              | Classify whether a graph admits a planar embedding  | —                | [SPEC-097](../specs/097-planarity-test/spec.md)                        |
| `planar-embedding`            | Return a combinatorial embedding for a planar graph | `planarity-test` | [SPEC-098](../specs/098-planar-embedding/spec.md)                      |

## Delivery order

1. Louvain and Label Propagation community detection
2. Traveling Salesman and Chinese Postman routing/optimization
3. Planarity Test
4. Planar Embedding, reusing the Planarity Test core

Each module has its own Analyze entry, spec, feature branch, and PR. All reuse the generated Analyze
form, Result, Trace, Reveal, and the shared visual rules. These Drafts preserve strict graph-kind
validation and make edge-weight interpretation explicit.
