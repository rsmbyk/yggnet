# Plan 080: Eulerian route analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-088
- **Bump:** minor

Add one Eulerian Route definition with Path/Circuit mode and optional Start. Use deterministic
Hierholzer traversal over real stored edges, then present the route through the generic path,
Trace, and Reveal contracts. Deliver independently on `feat/080-eulerian-route`.
