---
id: ITEM-114
status: in_review
title: 'Refine focused Tags row interaction states'
type: fix
priority: P2
effort: S
created: 2026-10-02
updated: 2026-10-02
spec: 106-tags-focused-row-hover
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: patch
release_version: 0.41.0
---

# ITEM-114: Refine focused Tags row interaction states

## Summary

Make the hover treatment for the Tags row focused on a graph item feel intentional and remove the
unwanted green ring while preserving clear keyboard navigation.

## Acceptance sketch

- Pointer hover on a focused Tags row does not use the distracting white highlight.
- The active focused-row state has no decorative green ring, while keyboard focus remains visible
  and distinguishable.

## Links

- Spec: [SPEC-106](../../specs/106-tags-focused-row-hover/spec.md)
- Related items: none
