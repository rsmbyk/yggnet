---
id: ITEM-031
status: backlog
title: "Directed edge visuals in world"
type: feat
priority: P1
effort: S
created: 2026-07-30
updated: 2026-07-30
spec:
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-031: Directed edge visuals in world

## Summary

Show clear direction on directed edges in the Threlte world so the directed flag is visible, not only in the manager.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Model and manager already expose directed + weight; world still draws plain cylinders. Related: ITEM-002 / SPEC-002, ITEM-004 / SPEC-004. Skins (cartographic/sci-fi) stay parked — technical look only.

## Acceptance sketch

- Directed edges render with a clear direction cue (arrow or equivalent) in the world
- Undirected edges remain plain (no arrow)
- Direction cue updates when the directed flag is toggled
- Cue respects current path/algo overlays without becoming unreadable
- No new skin system; stay within the technical visual language

## Links

- Spec:
- Related items: ITEM-002, ITEM-004
- Prior SPECs: [SPEC-002](../../docs/specs/SPEC-002/spec.md), [SPEC-004](../../docs/specs/SPEC-004/spec.md)
