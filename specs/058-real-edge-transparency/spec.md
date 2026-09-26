# Spec: Real edge transparency

- **ID:** 058
- **Status:** Done
- **Item:** ITEM-066
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** patch

## Intent

Non-matching edges during tag focus render genuinely faint via a transparent instanced mesh instead of the background-color fake.

## Scope

### In scope

- Two-bucket edge rendering (opaque matches, transparent dimmed) for shafts and arrow heads
- Pure partition helper with unit tests
- Removal of edge bg-lerp tinting

### Out of scope

- Overlay sync/clear semantics
- Node, label, or arrow-geometry changes
- Custom shader work

## Domain rules

- Partition is a pure function of (visible edges, overlay match sets): deterministic, no scene access.
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

- Domain/app tests:
- E2E:
- Implementation:
