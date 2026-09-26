---
id: ITEM-066
status: backlog
title: 'Real transparency for dimmed edges'
type: fix
priority: P3
effort: M
created: 2026-09-26
updated: 2026-09-26
spec: specs/058-real-edge-transparency
branch:
pr:
archived_at:
archive_reason:
bump: patch
release_version:
---

# ITEM-066: Real transparency for dimmed edges

## Summary

Give dimmed edges genuine transparency instead of the `instanceTint` background-lerp fake, which re-lights wrong under the standard material and leaves non-matching edges looking solid during tag focus.

## Notes

- Constraint: one `InstancedMesh` cannot do per-instance opacity. Draft approach: split buckets per frame — matches stay in the opaque mesh, non-matches move to a `transparent` mesh at low opacity with `depthWrite` off. Same treatment for arrow heads. Two draw calls, no custom shaders.
- `instanceTint` bg-lerp goes away for edges (keep the helper only if still used elsewhere).
- TDD: extract the match/dim partition into a pure, unit-tested helper under `src/lib/world/`; pixels can't be asserted in E2E, so E2E keeps covering overlay state only.

## Acceptance sketch

- With a focus tag active, non-matching edges render genuinely faint (transparent material), matching edges fully solid.
- No z-fighting or occlusion regressions between dimmed edges, matches, nodes, and labels.
- Overlay state behavior (sync/clear) unchanged.

## Links

- Spec: [058-real-edge-transparency](../../specs/058-real-edge-transparency/spec.md)
- Related items: ITEM-047
