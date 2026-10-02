# Plan 083: Maximum independent set analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-091
- **Bump:** minor

Add a fieldless exact Maximum Independent Set definition for undirected graphs. Reuse the focused
exact-set primitives introduced by SPEC-082 while enforcing self-loop exclusion and deterministic
ties. Deliver independently on `feat/083-maximum-independent-set`.
