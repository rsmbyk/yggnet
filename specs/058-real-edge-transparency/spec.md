# Spec: Real edge transparency

- **ID:** 058
- **Status:** Accepted
- **Item:** ITEM-066
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** patch

## Intent

Non-matching edges during tag focus render genuinely faint via a transparent instanced mesh instead of the background-color fake.

## Scope

### In scope

- Two-bucket edge rendering (opaque matches, transparent dimmed) for shafts and arrow heads
- Split-bucket partitioning within the world renderer
- Removal of edge bg-lerp tinting

### Out of scope

- Overlay sync/clear semantics
- Node, label, or arrow-geometry changes
- Custom shader work

## Domain rules

- Partitioning is deterministic from visible edges and overlay match sets; it remains local to the world renderer.
- Dimmed bucket: `transparent`, low opacity, `depthWrite: false`.
- Match bucket rendering is pixel-identical to today when nothing is dimmed.

## Acceptance scenarios

### Scenario: Dimmed edges fade

- **Given** a focus tag is active with non-matching edges present
- **When** the world renders
- **Then** non-matching shafts/arrows use the transparent dimmed mesh while matches stay opaque

### Scenario: No focus, no change

- **Given** no focus tag (or cleared overlay)
- **When** the world renders
- **Then** all edges render in the opaque mesh exactly as before

### Scenario: Overlay behavior intact

- **Given** the existing focus/overlay suites
- **When** they run
- **Then** they stay green (state semantics untouched)

## Traceability

- Implementation: PR [#33](https://github.com/rsmbyk/yggnet/pull/33), merged 2026-09-26; `src/lib/world/GraphScene.svelte` renders matching and dimmed shafts/arrowheads in separate opaque and transparent instanced meshes.
- Verification: PR #33 CI and the remediation PR run `npm run test:coverage`, `npm run build`, and `npm run test:e2e`; the transparent rendering behavior is visual and is verified by the implementation review rather than a pixel assertion.
- E2E: the full Playwright suite preserves existing tag-focus/overlay-state coverage; no new pixel-sensitive E2E assertion was added.
- Historical release evidence: ITEM-066 records PR #33 and release version `0.38.0`.
