---
id: SPEC-047
item: ITEM-047
type: feat
feature_area: manager
bump: minor
status: done
title: 'Shared tags + Tags tool'
created: 2026-09-26
updated: 2026-09-26
---

# Spec: Shared tags + Tags tool

- **ID:** 047
- **Status:** Accepted
- **Item:** ITEM-047
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** minor

## Intent

One shared tag vocabulary for nodes and edges, validated charset, and a Tags tool that manages focus (world emphasize/dim), rename, and cascade delete — replacing the old Filters comma/Apply/hide UI.

## Scope

### In scope

- Charset `^[a-zA-Z0-9-]+$`; silent strip of invalid tags on parse/ops/TagPicker
- Shared suggestion pool across TagPicker and Nodes/Edges list filters
- Tags tool (rename from Filters): usage-sorted list, search, focus controls, reset, rename companion, delete
- World emphasize/dim when focus non-empty (nodes and edges with any focus tag)
- Nodes list search: Nodes|Tags optgroups + Tag badge + node chips
- TagPicker empty copy: No tags yet / All tags added; quieter styling

### Out of scope

- Case-folding / auto-lowercase
- Saved focus presets
- Creating new tags from the Tags tool list
- Document-level tag registry field / JSON key renames

## Domain rules

- Tags are `string[]` on nodes and edges; document universe = union of both
- Valid tag: non-empty, matches `^[a-zA-Z0-9-]+$`; case preserved; equality case-sensitive
- `normalizeTags` drops invalids (silent); parse/import never rejects the document for bad tags
- `renameTag(doc, from, to)` rewrites every occurrence; target must be valid and not collide
- `deleteTag(doc, tag)` removes the tag from every node and edge
- Session `focusTags: string[]` starts empty; when non-empty, matching entities emphasized and others dimmed

## Acceptance scenarios

### Scenario: Shared pool

- **Given** a node has tag `alpha` and an edge has tag `beta`
- **When** the user opens TagPicker on another node
- **Then** suggestions include both `alpha` and `beta`

### Scenario: Charset silent strip

- **Given** imported JSON with a node tag `bad tag!`
- **When** the document is parsed
- **Then** that invalid tag is dropped and the document still opens

### Scenario: Tags tool focus

- **Given** documents tags `a` and `b` exist
- **When** the user Add/Removes `a` into focus
- **Then** the `a` list row is emphasized, `b` is dimmed, and world entities without `a` are dimmed

### Scenario: Show only this

- **Given** focus contains `a` and `b`
- **When** the user clicks Show only this on `c`
- **Then** focus is exactly `["c"]`

### Scenario: Rename companion

- **Given** tag `old` exists and `taken` exists
- **When** the user edits `old` to `taken`
- **Then** helper shows error and Save is disabled
- **When** the user edits to `new` and Saves
- **Then** all nodes/edges with `old` now have `new`

### Scenario: Delete cascade

- **Given** nodes and edges carry tag `gone`
- **When** the user deletes `gone` from the Tags tool
- **Then** no node or edge still has `gone`

### Scenario: Nodes list optgroups

- **Given** the Nodes tool list search is open
- **When** suggestions are shown
- **Then** sections Nodes and Tags appear with Tag badge on tag rows

### Scenario: TagPicker empty copy

- **Given** no document tags exist
- **When** TagPicker dropdown shows empty
- **Then** copy is “No tags yet” (not “No matching tags”)

## Traceability

- Domain/app tests: `src/lib/graph/tags.test.ts`; ops/parse; `nodeListFilter.test.ts`
- E2E: `e2e/tags-tool.e2e.ts`; Nodes list optgroups coverage
- Implementation: `src/lib/graph/tags.ts`; session focus; ManagerPanel Tags section; TagPicker; GraphScene
