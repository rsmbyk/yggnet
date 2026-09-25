---
id: ITEM-046
status: done
title: 'Manager Nodes/Edges list UX'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: SPEC-046
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-046: Manager Nodes/Edges list UX

## Summary

Formalize vibe-session behavior for **Manager Nodes/Edges list UX** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- Edges filter shows Nodes vs Tags sections with Tag badge on tag rows
- Edge weight ≠ 1 shows as number pill
- Companion sheet opens for edge create/edit without a Label field
- nodeListFilter / edgeListFilter drive list queries

## Links

- Spec: [SPEC-046](../../docs/specs/SPEC-046/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
