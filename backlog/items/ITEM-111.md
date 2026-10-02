---
id: ITEM-111
status: in_review
title: 'Improve Analyze result presentation'
type: fix
priority: P1
effort: M
created: 2026-10-02
updated: 2026-10-02
spec: 103-analysis-result-presentation
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: patch
release_version: 0.41.0
---

# ITEM-111: Improve Analyze result presentation

## Summary

Improve the Analyze result panel’s hierarchy and fit, make large artifacts easier to scan, and
clarify grouped, mapped, and colored results.

## Acceptance sketch

- Result/Trace tabs have a separator before the view content; result content grows to the available
  viewport height before the body becomes scrollable.
- Data-structure cards are collapsed by default and retain disclosure state for the current run;
  card spacing matches the rest of the metrics.
- Grouped results use named subheaders and member lists; map-like and ranking artifacts use
  accessible tables; coloring groups include labeled palette swatches.
- No result and Rejected are distinct, readable status banners.

## Links

- Spec: [SPEC-103](../../specs/103-analysis-result-presentation/spec.md)
- Related items: ITEM-110
