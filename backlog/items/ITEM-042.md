---
id: ITEM-042
status: done
title: 'Solid nodes + pointer intents'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: specs/042-solid-nodes-pointer-intents
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-042: Solid nodes + pointer intents

## Summary

Formalize vibe-session behavior for **Solid nodes + pointer intents** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- node-physics prevents overlap and clamps to floor
- node-click resolves select / multi / connect actions from modifiers
- Connect banner shows while connecting; Esc/RMB cancels
- Spawned nodes use WORLD.collision and WORLD.nodeRadius

## Links

- Spec: [042-solid-nodes-pointer-intents](../../specs/042-solid-nodes-pointer-intents/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
