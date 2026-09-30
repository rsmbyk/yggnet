# Traversal Result Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make traversal inputs, endpoints, reveal colors, unsuccessful outcomes, IDDFS phase pacing, and Random Walk termination match accepted SPEC-063.

**Architecture:** Keep algorithms responsible for final artifacts and semantic reveal actions, while pure world policy maps those actions onto time and visual roles. Generated Analyze inputs normalize through the existing contracts, and the Svelte/Threlte surfaces consume generic state without algorithm-specific branches.

**Tech Stack:** TypeScript 6, Svelte 5, Threlte/Three.js, Vitest 4, Playwright 1.60.

**Spec:** `specs/063-traversal-result-clarity/spec.md`

## Global Constraints

- Use generic, structured-clone-safe reveal contracts; do not add algorithm-specific UI or world components.
- Use a 600 ms hold only between reveal phases; reduced motion resolves immediately.
- Active exploration is orange, completed exploration is muted green, and final path replay is gold.
- Every analysis line must reference and align with a real graph edge.
- Random Walk retains Max steps as a safety bound and uses legal outgoing-neighbor semantics.
- Keep `src/lib/graph/**` coverage at or above 90%; add no dependencies.

## Review Focus

- An enum with an empty options array must remain unset without throwing; an enum with options must normalize to its first option.
- Returning to an algorithm after selecting Search must preserve Search rather than overwrite it with Traverse.
- A Search path of length zero must emphasize the combined Start/End node without inventing an edge replay.
- An IDDFS timeline with one phase must add no phase hold, while a multi-phase timeline adds exactly one 600 ms hold per boundary.
- Random Walk on a directed graph must not count reverse-only nodes as reachable and must report revisits in `Steps taken`.

---

### Task 1: Accept the pack and materialize enum defaults

**Files:**

- Modify: `specs/063-traversal-result-clarity/{plan,spec,tasks}.md`
- Modify: `backlog/items/ITEM-071.md`
- Modify: `backlog/board.md`
- Modify: `src/lib/graph/analysis/contracts.ts`
- Modify: `src/lib/graph/analysis/traversal-algorithms.test.ts`
- Modify: `src/lib/session/app.svelte.ts`
- Test: `src/lib/session/app-analysis.test.ts`

**Interfaces:**

- Consumes: `AnalysisDefinition.fields`, `AnalysisField.options`, and remembered `AnalysisSessionState.inputs`.
- Produces: `normalizeAnalysisInput(definition, input)` with first-option enum defaults and session inputs whose visible value matches normalized state.

- [ ] **Step 1: Record the owner's acceptance**

Set SPEC-063 plan/spec/tasks status to `Accepted`, check T0, and move ITEM-071 from Speccing to Ready.

- [ ] **Step 2: Write failing normalization tests**

Add tests proving an unset enum normalizes to its first option, an empty option list stays absent, and an explicit `search` value survives normalization.

```ts
expect(normalizeAnalysisInput(definition, {})).toEqual({ mode: 'traverse' });
expect(normalizeAnalysisInput(emptyEnumDefinition, {})).toEqual({});
expect(normalizeAnalysisInput(definition, { mode: 'search' })).toEqual({ mode: 'search' });
```

- [ ] **Step 3: Run the focused tests red**

Run: `npx vitest run --project server src/lib/graph/analysis/traversal-algorithms.test.ts src/lib/session/app-analysis.test.ts`

Expected: FAIL because an enum without `defaultValue` remains absent and session state does not materialize the displayed default.

- [ ] **Step 4: Implement the first-option fallback**

Add one shared helper in `contracts.ts` that returns an explicit value, then `defaultValue`, then `field.options[0]?.value` for enum fields. Use it from normalization and active-field evaluation. Initialize an algorithm's remembered input through `normalizeAnalysisInput` when it is first selected, without replacing existing input.

- [ ] **Step 5: Run focused tests green and commit**

Run the command from Step 3, then commit with `fix(analyze): initialize traversal mode`.

### Task 2: Stop Random Walk on completed work

**Files:**

- Modify: `src/lib/graph/analysis/algorithms.ts`
- Test: `src/lib/graph/analysis/traversal-algorithms.test.ts`

**Interfaces:**

- Consumes: `neighborsOf(snapshot, nodeId)` and normalized `mode`, `target`, `maxSteps`, and `seed`.
- Produces: Random Walk results with `Steps taken`, deterministic early termination, unchanged used-seed reporting, and the existing reveal/trace shapes.

- [ ] **Step 1: Write failing termination tests**

Cover Target found before Max steps, all outgoing-reachable nodes covered in Traverse, unreachable Search target after reachable coverage, directed reverse edges excluded, isolated Start, and revisit-inclusive edge counts.

```ts
expect(metric(output, 'Steps taken')).toBe(outputWalk.edgeIds.length);
expect(output.events.filter((event) => event.action === 'walk-step')).toHaveLength(stepsTaken);
expect(output.events.at(-1)?.action).toBe('coverage-complete');
```

- [ ] **Step 2: Run the Random Walk tests red**

Run: `npx vitest run --project server src/lib/graph/analysis/traversal-algorithms.test.ts -t "Random Walk"`

Expected: FAIL because the walk currently continues until Target, dead end, or Max steps and reports `Steps`.

- [ ] **Step 3: Implement reachable-coverage termination**

Before walking, breadth-first collect the Start's outgoing-reachable node IDs. After each visit—and before the first move for an isolated Start—stop when Search found Target or the visited set covers that reachable set. Preserve dead-end and Max steps termination, emit a semantic termination event, and rename the metric to `Steps taken`.

- [ ] **Step 4: Run Random Walk and all analysis tests green**

Run: `npx vitest run --project server src/lib/graph/analysis/traversal-algorithms.test.ts src/lib/graph/analysis/analysis.test.ts`

- [ ] **Step 5: Commit**

Commit with `fix(analyze): stop completed random walks`.

### Task 3: Schedule phase holds and ordered path replay

**Files:**

- Modify: `src/lib/graph/analysis/contracts.ts`
- Modify: `src/lib/graph/analysis/algorithms.ts`
- Modify: `src/lib/world/analysis-decoration.ts`
- Test: `src/lib/graph/analysis/traversal-algorithms.test.ts`
- Test: `src/lib/world/analysis-decoration.test.ts`

**Interfaces:**

- Consumes: `AnalysisRevealTimeline` phases and semantic reveal actions.
- Produces: `analysisRevealDuration(timeline)`, `analysisRevealProgress(timeline, elapsedMs, reducedMotion)`, retained footprint roles, active entity IDs, and ordered emphasized path entity roles.

- [ ] **Step 1: Write failing reveal-policy tests**

Test a one-phase timeline with no hold; a three-phase IDDFS timeline with two 600 ms holds; boundary progress frozen during each hold; reduced motion returning 1; active nodes/edges only during their step; and emphasized path entities accumulating without clearing the explored footprint.

```ts
expect(analysisRevealDuration(timeline)).toBe(baseDuration + 1_200);
expect(progressDuringFirstHold).toBe(progressAtFirstBoundary);
expect([...final.emphasizedEdgeIds]).toEqual(['e0', 'e1']);
```

- [ ] **Step 2: Run policy tests red**

Run: `npx vitest run --project server src/lib/world/analysis-decoration.test.ts src/lib/graph/analysis/traversal-algorithms.test.ts`

Expected: FAIL because timing currently flattens phases and path emphasis occurs in one terminal step.

- [ ] **Step 3: Extend generic reveal actions and frame state**

Add structured-clone-safe node/edge emphasis actions that accumulate separately from the explored footprint. Add `activeNodeIds`, emphasized node/edge roles, and an inter-phase scheduling function using `RESULT_REVEAL_PHASE_HOLD_MS = 600`. Keep `analysisRevealFrame` pure.

- [ ] **Step 4: Emit ordered path replay steps**

For BFS, DFS, DLS, IDDFS, Multi-source BFS, and Bidirectional BFS Search success, append ordered emphasis steps beginning with Start and then each path edge/destination node. No-result and Traverse outputs append none. Keep path artifacts unchanged.

- [ ] **Step 5: Run focused tests green and commit**

Run the command from Step 2, then commit with `fix(analyze): replay traversal search paths`.

### Task 4: Clarify world roles, endpoints, and no-result UI

**Files:**

- Modify: `src/lib/world/analysis-decoration.ts`
- Modify: `src/lib/world/GraphScene.svelte`
- Modify: `src/lib/ui/AnalysisResultPanel.svelte`
- Test: `src/lib/world/analysis-decoration.test.ts`
- Test: `src/lib/ui/analysis-panel-policy.test.ts`

**Interfaces:**

- Consumes: the Task 3 frame's footprint, active, emphasized, and landmark state.
- Produces: renderer-owned role colors/scales and an accessible `No result` status surface using `AnalysisResult.summary`.

- [ ] **Step 1: Write failing renderer-policy tests**

Assert active exploration maps to orange, completed exploration to muted green, final path to gold, endpoint/combined glyph scales exceed ordinary rings, edge roles never use `frontier`, `start-side`, or `target-side`, and all frame edge IDs exist in the document fixture.

- [ ] **Step 2: Run renderer tests red**

Run: `npx vitest run --project server src/lib/world/analysis-decoration.test.ts src/lib/ui/analysis-panel-policy.test.ts`

Expected: FAIL because colors/scales are embedded in `GraphScene.svelte` and no-result is a small paragraph.

- [ ] **Step 3: Centralize renderer policy and remove mystery lines**

Export pure analysis-role color and landmark-scale helpers. Render active exploration above a completed footprint without recoloring the base graph edge gold. Use node-only cyan/green side markers for Bidirectional BFS, common orange/green edge roles for all exploration, and verify overlay endpoints use the real edge geometry.

- [ ] **Step 4: Strengthen landmarks and no-result presentation**

Increase Start/End/combined glyph scale and contrast while retaining distinct geometry. Replace `.notice` with a `role="status"` result-status card containing heading `No result` and the algorithm summary before metrics and legend.

- [ ] **Step 5: Run check and focused tests green, then commit**

Run: `npm run check && npx vitest run --project server src/lib/world/analysis-decoration.test.ts src/lib/ui/analysis-panel-policy.test.ts`

Commit with `fix(analyze): clarify traversal results`.

### Task 5: Browser acceptance, full verification, and delivery

**Files:**

- Modify: `e2e/analyze-laboratory.e2e.ts`
- Modify: `specs/063-traversal-result-clarity/spec.md`
- Modify: `specs/063-traversal-result-clarity/tasks.md`
- Modify: `backlog/items/ITEM-071.md`
- Modify: `backlog/board.md`
- Modify: `CHANGELOG.md` if the existing `0.40.0` wording needs clarification

**Interfaces:**

- Consumes: completed Tasks 1-4.
- Produces: visible acceptance evidence and complete PR #38 records under release `0.40.0`.

- [ ] **Step 1: Add Playwright acceptance assertions**

Cover Mode's initial `Traverse` value, larger/different endpoint markers via stable test hooks, `No result` heading and summary, path-replay state ordering, IDDFS duration including phase holds, Random Walk `Steps taken`, and the absence of purple/green edge-role hooks in Multi-source/Bidirectional results.

- [ ] **Step 2: Run the Analyze E2E file**

Run: `npm run test:e2e -- e2e/analyze-laboratory.e2e.ts --workers=1`

Expected: all Analyze acceptance tests pass.

- [ ] **Step 3: Run full quality gates**

Run sequentially:

```bash
npm run check
npm run lint
npm run test:coverage
npm run test:e2e -- --workers=1
npm run build
```

Expected: zero errors, graph coverage at least 90%, and all Playwright tests pass.

- [ ] **Step 4: Complete traceability and delivery records**

Fill actual file paths in SPEC-063, check completed tasks, set ITEM-071 `status: in_review` and `release_version: 0.40.0`, move it to In review beside ITEM-070, and update PR #38 Summary/Spec/Test plan.

- [ ] **Step 5: Commit, push, and verify remote checks**

Commit with `docs(delivery): record traversal clarity review`, push the feature branch, attach/retain PR #38, and wait for CI and Vercel on the exact remote head. Do not merge the draft PR.
