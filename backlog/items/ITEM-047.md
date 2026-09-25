---
id: ITEM-047
status: in_review
title: 'Shared tags + Tags tool'
type: feat
priority: P1
effort: L
created: 2026-09-26
updated: 2026-09-26
spec: specs/047-shared-tags
branch: feat/047-shared-tags
pr:
archived_at:
archive_reason:
bump: minor
release_version: 0.31.0
---

# ITEM-047: Shared tags + Tags tool

## Summary

Unify node and edge tags into one document vocabulary with alphanumeric-hyphen validation, rebuild Filters into a Tags manager (focus/dim, rename, delete), and polish Nodes list search + TagPicker empty copy.

## Notes

- Tags remain on nodes/edges (no document-level registry).
- Invalid tags are silently stripped on parse/ops.
- World emphasize/dim follows session focus tags for both nodes and edges.

## Acceptance sketch

- Shared suggestion pool for TagPicker and list filters
- Tags charset `^[a-zA-Z0-9-]+$` with silent strip
- Tags tool: list by usage, focus controls, rename companion, cascade delete
- Nodes list search uses Nodes|Tags optgroups like Edges
- TagPicker empty: No tags yet / All tags added

## Links

- Spec: [047-shared-tags](../../specs/047-shared-tags/spec.md)
- Related: ITEM-017, ITEM-046
