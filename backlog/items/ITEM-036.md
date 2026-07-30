---
id: ITEM-036
status: ready
title: "Step annotations readback + playback"
type: feat
priority: P1
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-036
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-036: Step annotations readback + playback

## Summary

Show saved step annotations when scrubbing a cached trace, and provide play/pause auto-advance over that trace without re-running the algorithm.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Annotate can write; notes are not shown after save. Playback state exists with no play UI. Related: ITEM-010 / SPEC-010, ITEM-014 / SPEC-014.

## Acceptance sketch

- User can attach a note to a step of a cached run
- Notes remain visible when revisiting that step (scrubber or list)
- Play/pause auto-advances through the cached trace without re-running
- Playback can be stopped and scrubbed manually
- Annotations persist with the run across save/load of the document where runs are stored

## Links

- Spec: [SPEC-036](../../docs/specs/SPEC-036/spec.md)
- Related items: ITEM-010, ITEM-014
- Prior SPECs: [SPEC-010](../../docs/specs/SPEC-010/spec.md), [SPEC-014](../../docs/specs/SPEC-014/spec.md)
