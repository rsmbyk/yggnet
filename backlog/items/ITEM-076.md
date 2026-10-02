---
id: ITEM-076
status: in_review
title: 'Connectivity region analysis'
type: feat
priority: P1
effort: L
created: 2026-10-01
updated: 2026-10-02
spec: specs/068-connectivity-regions/spec.md
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-076: Connectivity region analysis

## Summary

Add connected, weakly connected, and strongly connected component definitions to Analyze.

## Notes

- Component memberships have stable renderer-owned colors plus textual Result membership.

## Acceptance sketch

- Each definition returns deterministic full-graph components under its documented direction rules.

## Links

- Spec: [SPEC-068](../../specs/068-connectivity-regions/spec.md)
