---
id: ITEM-045
status: done
title: 'Toolbar + tools panel chrome'
type: feat
priority: P1
effort: M
created: 2026-09-25
updated: 2026-09-25
spec: SPEC-045
branch: vibe/session-20260730
pr: 16
archived_at:
archive_reason:
release_version:
---

# ITEM-045: Toolbar + tools panel chrome

## Summary

Formalize vibe-session behavior for **Toolbar + tools panel chrome** onto the normal SPEC process without rewriting the shipped UX.

## Notes

Reference implementation lives on `vibe/session-20260730`. Characterization tests lock behavior; only SPEC-040 intentionally changes code (World Tune removal + textureSize 250).

## Acceptance sketch

- yggnet-toolbar lists tool ids from tool-ids
- Opening a tool shows the tools panel with sticky chrome
- tools-panel-limit computes max height
- Escape closes pickers without always closing the whole tools panel (per existing rules)

## Links

- Spec: [SPEC-045](../../docs/specs/SPEC-045/spec.md)
- Related: vibe formalization ITEM-039…046; draft PR 16
