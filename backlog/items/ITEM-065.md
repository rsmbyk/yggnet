---
id: ITEM-065
status: in_progress
title: 'Remove Diff tool'
type: feat
priority: P2
effort: S
created: 2026-09-26
updated: 2026-09-26
spec: specs/057-remove-diff-tool
branch: feat/057-remove-diff-tool
pr:
archived_at:
archive_reason:
bump: minor
release_version:
---

# ITEM-065: Remove Diff tool

## Summary

Remove the Diff toolbar tool: panel section (`Add selection`, diff list), `diffIds` session state (`setDiffIds`/`pushDiff`), and related E2E. Mark `SPEC-018` Deprecated.

## Notes

- `diffIds` is UI-only state (no document-model change), so removal is `minor`, following the Filters→Tags precedent.
- Verify at Draft time that nothing else consumes `diffIds` (compare/analyze paths are separate but must be checked).
- No replacement UI in this slice.

## Acceptance sketch

- No Diff tool in the toolbar and no Diff panel section.
- No `diffIds` state, actions, or references remain in session/UI code.
- SPEC-018 marked Deprecated; its E2E removed or repurposed.
- All other tools and overlays behave as before.

## Links

- Spec: [057-remove-diff-tool](../../specs/057-remove-diff-tool/spec.md)
- Related items: ITEM-064
