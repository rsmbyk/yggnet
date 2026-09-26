# Plan 047: Shared tags + Tags tool

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-047
- **Bump:** minor

## Why

Node and edge tags were separate free-form pools; Filters was a comma field + Apply + hide checkbox. Product wants one shared vocabulary, strict charset, and a Tags tool to focus/rename/delete.

## Scope / edges

**In:**

- Shared document tag universe + charset validation (silent strip)
- Tags tool replacing Filters UI (list, focus, reset, rename companion, cascade delete)
- World emphasize/dim from focus tags (nodes and edges)
- TagPicker shared pool + empty-copy polish
- Nodes list search Nodes|Tags optgroups

**Out:**

- Case-folding; saved focus presets; create-from-Tags-tool; JSON key renames

## Approach

Domain helpers (`isValidTag`, `normalizeTags`, usage, rename, delete) → session `focusTags` → Tags tool + companion → world dim. Shared `allDocumentTags` for pickers/filters.

## TDD

- Domain/app tests: `src/lib/graph/tags*.test.ts`, ops/parse coverage, nodeListFilter updates
- E2E: Playwright Tags tool focus/rename/delete; Nodes|Tags sections; charset strip

## Risks

- Click-outside closing both tool + companion is stricter than other tools — keep intentional
- Renaming tool id `filters` → `tags` touches e2e/testids
