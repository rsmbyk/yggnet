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
- Use one consistent reveal language: orange active step, muted-green completed footprint, gold successful path replay
- Remove side-specific purple/green edge lines from Multi-source and Bidirectional BFS while retaining simultaneous frontier meaning on nodes
- Present no-result as a prominent accessible status panel
- Add a generic 600 ms pause between reveal phases, used by IDDFS between depth iterations
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
2. Extend the generic result-reveal schedule so phase boundaries have a renderer-owned 600 ms hold. Reveal actions remain semantic and do not encode colors or wall-clock timing.
3. Treat exploration and path replay as two visual layers. The currently advancing entity is orange; completed exploration settles to muted green; a successful Search appends ordered path-replay steps in gold while leaving the footprint subordinate.
4. Keep multi-frontier concurrency in reveal steps, but express source-side identity on node glyphs only. Edge decoration always follows a real graph edge, uses the common traversal palette, and aligns with the base edge rather than resembling a duplicate connection.
5. Strengthen endpoint glyph size, contrast, and depth behavior through the shared landmark renderer. Promote no-result from a small paragraph to a labeled status surface.
6. Precompute the nodes reachable from Random Walk's Start under outgoing-edge semantics. Terminate immediately when the Target is found or every reachable node has been visited, while retaining dead-end and Max steps termination.

## TDD

- Domain/app: enum first-option normalization; Search reveal ordering; Random Walk termination reasons and exact step counts
- World policy: phase-gap schedule; active/settled/path roles; endpoint prominence policy; no duplicate or fabricated edge directions
- UI: prominent no-result semantics and synchronized Mode selection
- E2E: Mode default, endpoint/result presentation, path replay state, IDDFS pacing, Multi-source/Bidirectional edge palette, Random Walk early termination
- Commands: `npm run check`; `npm run lint`; `npm run test:coverage`; `npm run test:e2e -- --workers=1`; `npm run build`

## Risks

- A phase pause can accidentally slow ordinary one-phase reveals; apply it only between phases, never before the first or after the last.
- Random Walk full coverage is only meaningful over nodes reachable through legal outgoing moves; use that exact set and keep Max steps as a safety bound.
- Removing side colors from edges could hide bidirectional concurrency; preserve side identity with distinct node-frontier markers and simultaneous reveal steps.
- Base and analysis edge layers can visually diverge; assert that every revealed edge references a real edge and shares its endpoints.

## Delivery

This refinement stays in draft PR #38 with SPEC-062. ITEM-071 declares a patch intent, but the shared PR already carries the higher minor release `0.40.0`; no second version bump is created.
