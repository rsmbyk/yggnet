# Backlog

Kanban lives in [`board.md`](./board.md). Cards link to [`items/`](./items/). History in [`archives.md`](./archives.md).

Templates: [`items/_template.md`](./items/_template.md). Specs: [`../specs/_template/`](../specs/_template/).

Process: [`../docs/PROCESS.md`](../docs/PROCESS.md).

## Owner gates

| Phrase                    | Effect                                       |
| ------------------------- | -------------------------------------------- |
| Capture ideas             | Agent creates `ITEM-XXX`                     |
| `spec ITEM-…` / Draft     | Write `specs/NNN-slug/{plan,spec,tasks}.md`  |
| Accept / OK on Draft      | Board → Ready                                |
| Execute Accepted Draft    | In progress + branch                         |
| OK on PR                  | Merge per Git Flow → Done                    |
| Cut `main` (versioned)    | Tag `vX.Y.Z` + GitHub Release (same session) |
