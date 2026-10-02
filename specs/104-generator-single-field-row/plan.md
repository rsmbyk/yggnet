# Plan 104: Generator single-field row

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-112
- **Bump:** patch

## Why

The last unpaired Generate field is unnecessarily narrow even when a full row is available. Density
in the Bipartite form should span the row after the related Left and Right fields.

## Scope / edges

**In:** responsive layout of unmatched final Generate fields, including Bipartite Density.

**Out:** changing field order, labels, validation, or values; changing related pairs such as Left/Right
or Turns/Chord.

## Approach

Use the existing generator field grouping/layout metadata and let an unmatched field fill the
available row without disturbing explicit pairs or small-screen behavior.

## TDD

- UI tests: Generate form layout policy/component tests.
- E2E: `e2e/generate-form.e2e.ts`.

## Risks

- Preserve explicit pair alignment and ensure the full-row rule does not incorrectly merge unrelated
  fields.
