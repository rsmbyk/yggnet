---
id: ITEM-040
status: in_review
title: "Canonical world config"
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: SPEC-040
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-040: Canonical world config

## Summary

Formalize vibe-session behavior for **Canonical world config** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- WORLD.grid.textureSize is 250; groundSize is 10000
- docs/world-scale.md matches WORLD (no World Tune references)
- No world-tune panel/toggle; no /__yggnet/world-config writer plugin
- defaultCameraPosition() matches WORLD.camera.defaultPosition math

## Links

- Spec: [SPEC-040](../../docs/specs/SPEC-040/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
