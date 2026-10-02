# Plan 064: Binary-weight shortest path

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-072
- **Bump:** minor

## Why

0–1 BFS gives Dijkstra-equivalent shortest paths more directly when costs are strictly binary.

## Approach

Add a Search-only `AnalysisDefinition` with Start and Target. Validate the whole graph before
execution: every stored edge must have weight exactly `0` or `1`. Use a deterministic deque:
zero-cost relaxations enter its front and one-cost relaxations its back. Reuse shared result,
Trace, inspector, endpoint, and orange-exploration/green-path Reveal contracts.

## TDD and delivery

Start with domain tests for eligibility, directed edges, ties, zero-weight edges, disconnected
graphs, and costs. Then add generated-form/result/Trace tests and a Playwright flow. Deliver from
`feat/064-binary-weight-shortest-path` in its own PR after all gates pass.
