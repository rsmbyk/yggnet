# SPEC-050 — Plan

## Problem

The Tags tool has several related interaction and presentation issues: unclear rename guidance and spacing, a small editor click target, a generic editor header, and a bare search input in the panel body.

## Approach

Treat these as one Tags-tool UX slice. Update the rename helper copy and local spacing, expand editor activation to the row's non-action area, use the tag label in the editor header, and move the existing search input into the header with standard field styling. Preserve current validation, rename, focus, delete, and filtering behavior.

## Architecture touchpoints

- `src/lib/ui/ManagerPanel.svelte` — Tags header/body, tag rows, rename helper, and header title
- `e2e/tags-tool.e2e.ts` — end-to-end coverage for the combined interaction and presentation behavior

## Verification

- Add/extend Playwright scenarios for all SPEC-050 acceptance criteria.
- Verify row action buttons stay independent and accessible.
- Verify tag validation, filtering, and focus controls remain unchanged.
- Run focused Tags tool E2E and repository checks.

## Non-goals

- Changing tag model, charset, filtering/focus semantics, or behavior of other tools.
- Broad changes to shared helper or input styles beyond the scoped Tags UI.
