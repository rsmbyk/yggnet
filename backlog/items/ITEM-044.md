---
id: ITEM-044
status: done
title: 'In-world selection sheet + create'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: specs/044-in-world-selection-sheet-create
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-044: In-world selection sheet + create

## Summary

Formalize vibe-session behavior for **In-world selection sheet + create** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- Selecting a node shows the in-world selection sheet
- world-add-node creates a node near the view target
- Delete selection removes selected nodes/edges
- Connect banner + cancel path works from world

## Links

- Spec: [044-in-world-selection-sheet-create](../../specs/044-in-world-selection-sheet-create/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
