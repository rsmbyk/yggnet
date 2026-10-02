# Plan 084: Minimum vertex cover analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-092
- **Bump:** minor

Add a fieldless exact Minimum Vertex Cover definition for undirected graphs. Reuse focused exact-set
primitives, force self-looped nodes into the cover, and choose one deterministic minimum under the
20-node limit. Deliver independently on `feat/084-minimum-vertex-cover`.
