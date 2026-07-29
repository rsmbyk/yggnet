# Backlog

Kanban lives in [`board.md`](./board.md). Cards link to [`items/`](./items/). History in [`archives.md`](./archives.md).

Templates: [`items/_template.md`](./items/_template.md). Specs: [`../docs/specs/_template/`](../docs/specs/_template/).

## Owner gates

| Phrase             | Effect                          |
| ------------------ | ------------------------------- |
| Capture ideas      | Agent creates `ITEM-XXX`        |
| `spec ITEM-…`      | Write SPEC pack (Speccing)      |
| Ready / OK on spec | Board → Ready                   |
| `execute SPEC-XXX` | In progress + branch            |
| OK on PR           | Merge to `develop` → Done       |
| `release`          | Version + `main` + archive rows |
