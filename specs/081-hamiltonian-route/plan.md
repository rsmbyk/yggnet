# Plan 081: Hamiltonian route analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-089
- **Bump:** minor

Add one exact Hamiltonian Route definition with Path/Circuit mode and optional Start. Use bounded
bitmask dynamic programming with deterministic reconstruction and an explicit 20-node limit.
Deliver independently on `feat/081-hamiltonian-route`.
