# Analyze, Generate, and Tags UI revision map

- **Status:** Approved map; implementation remains gated on acceptance of each Draft spec.
- **Approved:** 2026-10-02
- **Order:** Analyze result presentation first; then the three independent UI fixes.

## Slices

| Order | Spec                                                          | Item     | Slice                                                                 | Depends on |
| ----- | ------------------------------------------------------------- | -------- | --------------------------------------------------------------------- | ---------- |
| 1     | [SPEC-103](specs/103-analysis-result-presentation/spec.md)    | ITEM-111 | Analyze result content, artifact presentation, and status readability | None       |
| 2     | [SPEC-104](specs/104-generator-single-field-row/spec.md)      | ITEM-112 | Full-row layout for an unmatched Generate field                       | None       |
| 3     | [SPEC-105](specs/105-graph-replacement-arrow-cleanup/spec.md) | ITEM-113 | Remove stale directed-edge arrowheads when replacing a graph          | None       |
| 4     | [SPEC-106](specs/106-tags-focused-row-hover/spec.md)          | ITEM-114 | Improve hover and keyboard-focus treatment for focused Tags rows      | None       |

The sequence is a suggested delivery order, not a dependency: after SPEC-103, the remaining
slices can be implemented independently, subject to their individual Draft acceptance gates.
