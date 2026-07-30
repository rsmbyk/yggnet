---
id: ITEM-037
status: ready
title: "Attachments on nodes and edges"
type: feat
priority: P2
effort: M
created: 2026-07-30
updated: 2026-07-30
spec: SPEC-037
branch:
pr:
archived_at:
archive_reason:
release_version:
---

# ITEM-037: Attachments on nodes and edges

## Summary

Add, list, and remove local attachments on nodes and edges from the manager. Notes already work; attachment UI does not.

## Notes

Hardening after 0.21.1; prior card archived as released but incomplete. Model has `attachments[]`; no manager UI. Related: ITEM-026 / SPEC-026. Remote blob hosting stays out of scope — local name + data URL or text blob is enough.

## Acceptance sketch

- User can add an attachment to the selected node or edge (name + local payload)
- Attachments list is visible and removable in the manager
- Attachments persist in GraphDocument JSON (save/load/import/export)
- Attachment changes are undoable where other field edits are
- No remote hosting or file-sync backend

## Links

- Spec: [SPEC-037](../../docs/specs/SPEC-037/spec.md)
- Related items: ITEM-026
- Prior SPEC: [SPEC-026](../../docs/specs/SPEC-026/spec.md)
