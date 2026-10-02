# Plan 071: Minimum spanning trees

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-079
- **Bump:** minor

## Why

Analyze needs two inspectable minimum spanning tree strategies for connected undirected weighted graphs.

## Approach

Add fieldless Kruskal and Prim definitions. Validate empty, directed/mixed, and disconnected graphs
before execution. Use stored edge order for equal-weight ties. Emit existing tree artifacts and generic
Trace/Reveal semantics; only accepted tree edges persist as the green final result.
