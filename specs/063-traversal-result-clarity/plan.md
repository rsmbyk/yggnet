# Plan 063: Traversal result clarity and pacing

- **Status:** Draft
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-071
- **Bump:** patch

## Why

The traversal algorithms in draft PR #38 are functionally correct, but several presentation rules are ambiguous in practice. Mode can appear unset, endpoints do not dominate the result view, successful Search leaves mixed traversal colors instead of replaying its path, no-result feedback is easy to miss, IDDFS phases run together, and multi-frontier edge overlays look like unexplained extra connections. Random Walk also continues after it has already covered everything reachable.

## Scope / edges

**In:**

- Materialize the first enum option as the generic default when an Analyze enum field is unset
- Strengthen Start and End world landmarks without changing the underlying graph
- Use one consistent reveal language: orange traversed objects and a green successful path replay; Traverse finishes entirely orange
- Remove side-specific purple/green edge lines from Multi-source and Bidirectional BFS while retaining frontier-side meaning on nodes
- Present no-result as a prominent accessible status panel
- Use one fixed 180 ms reveal-step interval for every traversal algorithm
- Reveal exactly one node or one edge per timed step, independent of Trace event grouping
- Use a shorter generic 300 ms pause between IDDFS depth iterations
- Stop Random Walk at Target found, full outgoing-reachable coverage, dead end, or Max steps, whichever occurs first
- Report actual traversed edge count as `Steps taken`
- Domain, renderer-policy, UI, and Playwright regression coverage

**Out:**

- New algorithms, traversal ordering controls, user-configurable colors, or user-configurable phase timing
- Changes to Trace playback speed
- New graph edges or persisted analysis decoration
- Removing Max steps from Random Walk
- Changes to Dijkstra

## Approach

1. Normalize an unset enum field from its first declared option and keep the generated select synchronized with that normalized value. Remembered explicit selections remain unchanged.
2. Extend the generic result-reveal schedule so every algorithm advances at one fixed 180 ms interval and IDDFS phase boundaries have a renderer-owned 300 ms hold. Normalize algorithm output into exactly one node or edge action per timed step; Reveal grouping is independent of Trace grouping.
3. Treat exploration and path replay as two visual layers. Traversed nodes and discovery/walk edges remain orange; a successful Search appends ordered path-replay steps in green. Traverse and unsuccessful Search never introduce a second result color.
4. Replace multi-frontier simultaneous Reveal actions with deterministic one-object interleaving, while retaining source-side identity on node glyph geometry. Derive every overlay line from the referenced graph edge's real `from`/`to` endpoints; never infer forest geometry by pairing edge and traversal-order indexes. Trace remains unchanged.
5. Strengthen endpoint glyph size, contrast, fill, and depth behavior through the shared landmark renderer so Start/End dominate ordinary traversal rings. Promote no-result from a small paragraph to a labeled status surface.
6. Precompute the nodes reachable from Random Walk's Start under outgoing-edge semantics. Terminate immediately when the Target is found or every reachable node has been visited, while retaining dead-end and Max steps termination.

## TDD

- Domain/app: enum first-option normalization; Search reveal ordering; Random Walk termination reasons and exact step counts
- World policy: fixed reveal interval; shorter phase gap; orange traversal/green path roles; endpoint prominence; no duplicate or fabricated edge directions
- UI: prominent no-result semantics and synchronized Mode selection
- E2E: Mode default, endpoint/result presentation, path replay state, IDDFS pacing, Multi-source/Bidirectional edge palette, Random Walk early termination
- Commands: `npm run check`; `npm run lint`; `npm run test:coverage`; `npm run test:e2e -- --workers=1`; `npm run build`

## Risks

- Fixed step timing can make very large results lengthy; keep one explicit interval for semantic consistency and apply the phase pause only between phases.
- Random Walk full coverage is only meaningful over nodes reachable through legal outgoing moves; use that exact set and keep Max steps as a safety bound.
- Sequential multi-frontier Reveal can make one side look favored; interleave sides deterministically and preserve side identity with distinct node-frontier markers.
- Base and analysis edge layers can visually diverge; assert that every revealed edge references a real edge and shares its endpoints.

## Delivery

This refinement stays in draft PR #38 with SPEC-062. ITEM-071 declares a patch intent, but the shared PR already carries the higher minor release `0.40.0`; no second version bump is created.
