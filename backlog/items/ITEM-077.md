---
id: ITEM-077
status: done
title: 'Connectivity criticality analysis'
type: feat
priority: P1
effort: M
created: 2026-10-01
updated: 2026-10-02
spec: specs/069-connectivity-criticality/spec.md
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-077: Connectivity criticality analysis

## Summary

Add undirected bridges and articulation points to Analyze.

## Notes

- Directed or mixed graphs are ineligible rather than silently reinterpreted.

## Acceptance sketch

- Tarjan low-link analysis identifies critical edges and nodes deterministically.

## Links

- Spec: [SPEC-069](../../specs/069-connectivity-criticality/spec.md)
