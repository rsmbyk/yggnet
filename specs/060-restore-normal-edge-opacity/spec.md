---
id: SPEC-060
item: ITEM-068
type: fix
feature_area: world
bump: patch
status: Accepted
title: 'Restore normal edge opacity'
created: 2026-09-29
updated: 2026-09-29
---

# Spec: Restore normal edge opacity

- **ID:** 060
- **Status:** Accepted
- **Item:** ITEM-068
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** patch

## Intent

Edges are fully visible in the normal world state and become transparent only when they do not match an active dimming overlay such as Tags focus.

## Scope

### In scope

- Normal-state edge shafts and arrowheads render through the opaque instanced meshes
- Active-dimming overlays partition matching edges into the opaque bucket and non-matching edges into the transparent bucket
- Clearing focus restores every visible edge to the opaque bucket
- Renderer partition behavior is regression-tested through a pure helper

### Out of scope

- A new opacity value for dimmed edges
- Changes to nodes, labels, edge colors, geometry, selection, or overlay state semantics
- Pixel-level screenshot assertions

## Domain rules

- If `dimOthers` is false, every visible edge belongs to the opaque bucket regardless of `overlayEdgeSet` contents.
- If `dimOthers` is true, edges present in `overlayEdgeSet` belong to the opaque bucket and all other visible edges belong to the transparent bucket.
- Shafts and directed arrowheads use the same partition result.
- Hidden edges remain excluded before partitioning.

## Acceptance scenarios

### Scenario: Normal edges stay opaque

- **Given** the world has visible edges and no active dimming overlay
- **When** the world renders
- **Then** every visible edge shaft and directed arrowhead uses the opaque mesh
- **And** the transparent edge meshes have no instances

### Scenario: Tag focus dims only non-matches

- **Given** tag focus is active and some edges match the focused tag while others do not
- **When** the world renders
- **Then** matching edge shafts and arrowheads use the opaque mesh
- **And** non-matching edge shafts and arrowheads use the transparent mesh

### Scenario: Clearing focus restores opacity

- **Given** tag focus previously dimmed non-matching edges
- **When** the user clears tag focus
- **Then** every visible edge returns to the opaque mesh
- **And** no edge remains in the transparent mesh

## Traceability

- Domain/app tests: `src/lib/world/edge-partition.test.ts`
- E2E: `e2e/tags-tool.e2e.ts`
- Implementation: `src/lib/world/edge-partition.ts`; `src/lib/world/GraphScene.svelte`
