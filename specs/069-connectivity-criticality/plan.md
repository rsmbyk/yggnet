# Plan 069: Connectivity criticality analysis

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-077
- **Bump:** minor

## Why

Users need to see the individual nodes and edges whose removal would split an undirected network.

## Approach

Add fieldless Bridges and Articulation Points definitions using deterministic Tarjan low-link DFS.
Reject directed or mixed graphs before traversal. Record DFS stack, discovery index, low-link value,
parent edge, and findings in generic Trace inspectors. Emit existing node/edge-set artifacts and
shared warning roles whose world treatment is renderer-owned and persisted for the result.

## TDD and delivery

Test cycles, trees, disconnected graphs, self-loops, parallel edges, and stable order before
presentation/E2E coverage. Deliver independently on `feat/069-connectivity-criticality`.
