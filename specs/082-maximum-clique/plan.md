# Plan 082: Maximum clique analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-090
- **Bump:** minor

Add a fieldless exact Maximum Clique definition for undirected graphs. Introduce deterministic
bitset branch-and-bound primitives reusable by later exact set analyses, with a 20-node limit.
Deliver independently on `feat/082-maximum-clique`.
