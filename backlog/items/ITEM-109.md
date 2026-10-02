---
id: ITEM-109
status: in_review
title: 'Organize Analyze selection and preserve shared inputs'
type: fix
priority: P1
effort: M
created: 2026-10-02
updated: 2026-10-02
spec: 101-analysis-picker-state
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: patch
release_version: 0.41.0
---

# ITEM-109: Organize Analyze selection and preserve shared inputs

## Summary

Group the Analyze algorithm selector by category and retain compatible shared field values while
switching algorithms.

## Acceptance sketch

- Definitions appear under their existing category headings in the selector.
- Compatible shared inputs such as Start, End, and Mode survive algorithm changes.
- Invalid or incompatible values do not silently enter an execution.

## Links

- Spec: [SPEC-101](../../specs/101-analysis-picker-state/spec.md)
- Related items: none
