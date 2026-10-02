# Plan 072: DAG utilities

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-080
- **Bump:** minor

## Why

Analyze needs general DAG inspection beyond the existing DAG shortest-path definition.

## Approach

Add fieldless Topological Sort and Directed Cycle Detection definitions. Require directed edges,
use stable stored order, and return existing artifacts through shared Trace/Reveal semantics.
