# SPEC-048 — Plan

## Problem

The Edges tool currently displays edge rows in document enumeration order, which makes it harder to scan by endpoint.

## Approach

Sort only the visible Edges tool rows by the current `from` node label, then by the current `to` node label. Compare labels case-insensitively and use stable endpoint/edge IDs as tie-breakers. Sorting must not rewrite edge endpoints or affect direction, filtering, incident-edge views, or graph storage.

## Architecture touchpoints

- `src/lib/ui/ManagerPanel.svelte` — filtered Edges list derivation and rendering
- `e2e/manager-edges.e2e.ts` — visible row-order acceptance

## TDD / E2E sequence

1. Add acceptance coverage for primary and secondary endpoint order and directed endpoint preservation.
2. Implement sorted display derivation after filtering without mutating document data.
3. Run the focused Edges E2E test and repository checks.

## Risks

- Sorting canonical `from`/`to` values incorrectly could visually imply a direction change; retain the stored endpoint roles and only sort rows.
- Filtering must continue to operate over the same edge set.

## Non-goals

- Sorting incident-edge lists, graph/world rendering, or other edge views.
- Reordering or normalizing edge endpoints.
- Changing edge data or persistence.
