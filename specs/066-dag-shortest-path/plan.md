# Plan 066: Acyclic shortest path

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-074
- **Bump:** minor

## Why

Topological relaxation is a transparent fastest path algorithm for directed acyclic graphs and
allows negative weights without Bellman–Ford's repeated rounds.

## Approach

Validate that every edge is directed and the full graph has a deterministic topological order.
Reject an undirected edge or directed cycle clearly. Relax outgoing edges once in that order,
recording queue/order/distance/predecessor semantics in Trace and inspectors.

## TDD and delivery

Test cycle and undirected ineligibility, stable topological ties, negative edges, disconnected
Target, and Start position inside the order before UI/E2E coverage. Deliver from
`feat/066-dag-shortest-path` independently.
