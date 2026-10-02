---
id: ITEM-110
status: done
title: 'Improve Analyze result panel hierarchy'
type: fix
priority: P1
effort: M
created: 2026-10-02
updated: 2026-10-02
spec: 102-analysis-result-panel-usability
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: patch
release_version: 0.41.0
---

# ITEM-110: Improve Analyze result panel hierarchy

## Summary

Keep Result/Trace navigation and its legend visible while panel content scrolls, present long result
collections with expandable data-structure styling, and make failure/rejection states clear.

## Acceptance sketch

- Tabs and the current view’s legend remain visible while its body scrolls in a constrained panel.
- Large list results can be expanded using the existing Trace data-structure interaction style.
- Unsatisfiable results and rejected/ineligible analyses use distinct, high-contrast status banners.

## Links

- Spec: [SPEC-102](../../specs/102-analysis-result-panel-usability/spec.md)
- Related items: none
