---
id: ITEM-043
status: done
title: 'Labels, colors, edge geometry'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: SPEC-043
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-043: Labels, colors, edge geometry

## Summary

Formalize vibe-session behavior for **Labels, colors, edge geometry** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- WORLD.nodeColor / nodeSelectedColor / nodeHoverColor are the scene palette
- WORLD.labelDistance is 50
- edge-pose uses WORLD.edges dimensions for shaft and arrow placement

## Links

- Spec: [SPEC-043](../../docs/specs/SPEC-043/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
