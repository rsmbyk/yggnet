---
id: ITEM-033
status: archived
title: "Pin respected by layout"
type: feat
priority: P2
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-033
branch: feat/SPEC-033-pin-layout
pr: 
archived_at: 2026-07-30
archive_reason: released
release_version: 0.30.0
---

# ITEM-033: Pin respected by layout

## Summary

Provide a minimal layout (or re-layout action) that moves unpinned nodes and leaves pinned nodes fixed, so pin is a real product behavior.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Pin checkbox/API exist but nothing moves nodes. Related: ITEM-015 / SPEC-015. Prefer a small explicit re-layout over a continuous force sim unless SPEC says otherwise. Full auto-layout engine can stay modest.

## Acceptance sketch

- User can pin/unpin nodes (existing control is fine if wired)
- A layout or re-layout action moves unpinned nodes
- Pinned nodes keep their positions across that layout pass
- Layout changes are undoable
- Works with nodes placed via ITEM-032 drag/edit when that lands

## Links

- Spec: [SPEC-033](../../docs/specs/SPEC-033/spec.md)
- Related items: ITEM-015, ITEM-032
- Prior SPEC: [SPEC-015](../../docs/specs/SPEC-015/spec.md)
