# Plan 056: Remove Groups, autotag Group-N

- **Status:** Draft
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-064
- **Bump:** major

## Why

Owner decision: groups as a structural concept go away — collapse/expand/ungroup and the Groups tool are removed, leaving Tags as the single grouping vocabulary. The Nodes Group button survives as an auto-tagger so multi-select → shared tag stays one click.

## Scope / edges

**In:**

- Remove: Groups toolbar tool, panel section + empty view, session group actions/collapsed state, world collapse rendering, `groupId` model field, groups E2E, SPEC-016 Deprecated
- Group button (Nodes multi-select only): tag members `Group-N` via persistent monotonic doc counter (skip colliding hand-made names, never reuse)
- Old docs with `groupId` import cleanly

**Out:**

- Changing anything about tags, filtering, focus, or rename beyond consuming the new tag
- New collapse-like visuals

## Approach

Model + domain first (`groupId` removal, counter field, import tolerance, autotag helper with unit tests), then session (groupSelected rewrite, undo participation check), then UI removal (toolbar, panel, world), then E2E. Verify SPEC-016 deprecation wording.

## TDD

- Domain/app tests: autotag naming/counter/collision rules; `groupId`-free parse of legacy docs
- E2E: Group-button autotag incl. numbering across save/load; absence of Groups UI; legacy-doc import

## Risks

- `groupId` may be referenced in more places than expected (world, algorithms, persistence, docs) — inventory at implementation start.
- Counter placement on the document changes the doc schema (minor-shaped) inside a major slice; import/export round-trip must cover it.
- SPEC-053 Groups empty view (just shipped) is deleted weeks after landing — note the churn in the changelog.
