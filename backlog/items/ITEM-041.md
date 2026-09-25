---
id: ITEM-041
status: done
title: 'Camera chrome + 2D/3D'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: specs/041-camera-chrome-2d-3d
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-041: Camera chrome + 2D/3D

## Summary

Formalize vibe-session behavior for **Camera chrome + 2D/3D** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- camera-view-mode toggles between 2D and 3D
- Reset target/orbit/zoom buttons animate using WORLD camera defaults
- Minimap and camera readout remain visible with world
- Cursor: grab on empty space; default on nodes

## Links

- Spec: [SPEC-041](../../specs/041-camera-chrome-2d-3d/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
