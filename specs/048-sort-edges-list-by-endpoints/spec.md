---
id: SPEC-048
item: ITEM-048
type: feat
feature_area: manager
bump: minor
status: Accepted
title: 'Sort Edges list by endpoints'
created: 2026-09-25
updated: 2026-09-26
---

# SPEC-048: Sort Edges list by endpoints

## Problem

The Edges tool has no predictable ordering by endpoint, making rows harder to scan.

## Scope

Sort only Edges tool rows by the current `from` endpoint node label, then by the current `to` endpoint node label. Compare labels case-insensitively; use stable IDs to break ties. Do not modify endpoint roles, edge direction, filtering semantics, or other edge views.

## Acceptance scenarios

### Scenario: Primary endpoint ordering

- **Given** edges have different `from` node labels
- **When** the user opens the Edges tool
- **Then** rows are ordered by the `from` node label, case-insensitively

### Scenario: Secondary endpoint ordering

- **Given** multiple edges share the same `from` node label and have different `to` node labels
- **When** the user opens the Edges tool
- **Then** those rows are ordered by the `to` node label, case-insensitively

### Scenario: Direction and filtering are preserved

- **Given** a filtered set contains directed edges with distinct endpoint labels
- **When** the Edges tool displays the results
- **Then** rows are sorted for display, each edge still shows its stored `from` and `to` roles, and the filter returns the same matching edges

## Non-goals

- Sorting incident-edge displays, graph/world edges, or other lists
- Normalizing endpoint order or changing edge direction
- Changing graph data or persistence

## Test strategy

- Playwright: `e2e/manager-edges.e2e.ts`
