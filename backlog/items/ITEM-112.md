---
id: ITEM-112
status: done
title: 'Use full row for an unmatched Generate field'
type: fix
priority: P2
effort: S
created: 2026-10-02
updated: 2026-10-02
spec: 104-generator-single-field-row
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: patch
release_version: 0.41.0
---

# ITEM-112: Use full row for an unmatched Generate field

## Summary

When a Generate form ends with a field that has no related partner, let that field use the full
available row rather than leaving it constrained to one grid column.

## Acceptance sketch

- Bipartite Density spans the full row after the paired Left/Right fields.
- Existing related pairs, including Helix Turns/Chord, remain paired and responsive.

## Links

- Spec: [SPEC-104](../../specs/104-generator-single-field-row/spec.md)
- Related items: ITEM-108
