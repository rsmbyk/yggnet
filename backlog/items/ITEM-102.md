---
id: ITEM-102
status: in_review
title: 'Label Propagation community detection'
type: feat
priority: P1
effort: M
created: 2026-10-02
updated: 2026-10-02
spec: 094-label-propagation-community-detection
branch: feat/062-traversal-algorithms
pr: 38
archived_at:
archive_reason:
bump: minor
release_version: 0.41.0
---

# ITEM-102: Label Propagation community detection

## Summary

Find graph communities by repeatedly assigning nodes the label supported by their neighbors.

## Acceptance sketch

- Use deterministic node order and deterministic tie resolution.
- Treat edge weights as nonnegative vote strengths and explain that interpretation.
- Return a stable partition, modularity, iteration information, and readable community membership.

## Links

- Spec: [SPEC-094](../../specs/094-label-propagation-community-detection/spec.md)
