---
id: ITEM-039
status: done
title: 'World-first shell + HUD'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: specs/039-world-first-shell-hud
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-039: World-first shell + HUD

## Summary

Formalize vibe-session behavior for **World-first shell + HUD** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- Shell shows full-bleed world (`yggnet-world`) with floating HUD (`world-hud`)
- HUD exposes brand, undo, redo, add-node, and palette trigger
- World Tune toggle and panel are absent
- Too-small viewport shows blocking overlay with recovery when resized

## Links

- Spec: [039-world-first-shell-hud](../../specs/039-world-first-shell-hud/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
