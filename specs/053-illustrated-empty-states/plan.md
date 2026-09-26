# Plan 053: Illustrated empty states

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-058
- **Bump:** minor

## Why

Nodes/Edges show nothing when empty and Tags/Groups show text-only hints. Illustrated empty views (icon + title + hint) teach the next action and make filter-no-match distinguishable from truly-empty.

## Scope / edges

**In:**

- Reusable empty-view for Nodes, Edges, Tags, Groups with icon + title + hint
- Truly-empty vs filter-no-match variants per tool
- Reuse of existing toolbar/manager line-icon style, no new assets

**Out:**

- Changing list, filter, focus, or selection behavior
- New illustration assets or animation
- Manager layout changes from SPEC-051

## Approach

Add a small empty-view block in `src/lib/ui/ManagerPanel.svelte` per tool section, wired to existing filtered-list derivations (`filteredNodes`, `sortedFilteredEdges`, `tagsListFiltered`/`tagUsageList`, `groupIds`). Keep copy distinctions already present for Tags.

## TDD

- Domain/app tests: none expected (presentation-only)
- E2E (tool named after stack exists): new or extended Playwright coverage asserting icon + copy for each tool's empty and no-match states

## Risks

- Empty-view markup could disturb panel height/scroll limits; verify against the tools-panel max-height behavior.
- Icon reuse must stay accessible (decorative `aria-hidden`, text carries meaning).
