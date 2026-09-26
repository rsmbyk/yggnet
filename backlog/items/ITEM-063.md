---
id: ITEM-063
status: in_progress
title: 'Nodes keyword filter pill'
type: feat
priority: P2
effort: M
created: 2026-09-26
updated: 2026-09-26
spec: specs/055-nodes-keyword-filter
branch: feat/055-nodes-keyword-filter
pr:
archived_at:
archive_reason:
bump: minor
release_version: 0.36.0
---

# ITEM-063: Nodes keyword filter pill

## Summary

Replace exact-node chips in the Nodes filter dropdown with a single keyword pill that filters node labels by substring. The dropdown suggests tags only; typing offers a `Search "<text>"` row (mirroring TagPicker's create-row) that creates one replaceable, distinctly-colored keyword pill in first position.

## Notes

- Motivation: an exact-node chip shows precisely that node, which is nearly a no-op for finding nodes.
- Edges tool keeps endpoint-node chips (`edges touching X` stays meaningful); Nodes only.
- Rules: keyword filters labels by case-insensitive substring, ANDed with tag chips. At most one keyword pill; creating one replaces the old. Opening the dropdown with a keyword set prefills the input. Backspace on empty input (or the pill ×) clears it.
- Domain change: `nodeMatchesListFilter` gains a keyword parameter; `nodeSearchNodeIds` state goes away for the Nodes tool (session + ManagerPanel).
- Existing Nodes-optgroup E2E assertions (SPEC-050) get updated in the same slice.

## Acceptance sketch

- Nodes dropdown shows tag suggestions only, plus a `Search "<text>"` row while typing.
- Creating the keyword pill filters the list to label matches; pill is first and distinctly colored.
- Prefill, replace-on-create, Backspace/× clear all work.
- Edges endpoint filtering unchanged.

## Links

- Spec: [055-nodes-keyword-filter](../../specs/055-nodes-keyword-filter/spec.md)
- Related items: ITEM-046, ITEM-050
