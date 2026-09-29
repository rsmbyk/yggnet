---
id: ITEM-068
status: done
title: 'Restore normal edge opacity'
type: fix
priority: P1
effort: S
created: 2026-09-29
updated: 2026-09-29
spec: specs/060-restore-normal-edge-opacity
branch: fix/060-restore-normal-edge-opacity
pr: 36
archived_at:
archive_reason:
bump: patch
release_version: 0.38.1
---

# ITEM-068: Restore normal edge opacity

## Summary

Keep edges fully visible in the normal world state. Use the transparent edge bucket only for non-matching edges while a tag-focus or other dimming overlay is active.

## Notes

- Regression source: SPEC-058 partitions solely by membership in `overlayEdgeSet`; the empty set used by the normal state therefore sends every edge to the transparent bucket.
- Preserve the split opaque/transparent rendering introduced by SPEC-058.
- Add a renderer-level regression test for the partition rule before changing `GraphScene.svelte`.

## Acceptance sketch

- With no active dimming overlay, every visible edge shaft and arrowhead uses the opaque bucket.
- With tag focus active, matching edges remain opaque and non-matching edges use the transparent bucket.
- Clearing tag focus restores all edges to the opaque bucket.

## Links

- Spec: [060-restore-normal-edge-opacity](../../specs/060-restore-normal-edge-opacity/spec.md)
- Related items: ITEM-047, ITEM-066
