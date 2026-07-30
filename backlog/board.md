# Backlog board

In-repo Kanban. Each card is an `ITEM-XXX`. Details live in the item (and SPEC) files.
Status moves follow project process (DoR → Ready → execute → PR review → Done → archive on release or drop).

**Approvals:** only an authorized project owner/reviewer promotes to Ready, authorizes `execute SPEC-XXX`, approves merge PRs, and calls `release`.

**Archive:** [`archives.md`](./archives.md) (not a column). Done = on `develop`, not yet in a production release.

### Column meanings

| Column      | Meaning                                          |
| ----------- | ------------------------------------------------ |
| Backlog     | Captured — no complete SPEC yet                  |
| Speccing    | SPEC pack in progress                            |
| Ready       | DoR met + owner OK — may execute                 |
| In progress | Execution started — feature/hotfix branch        |
| In review   | PR open — awaiting approval                      |
| Done        | Merged to `develop`, awaiting production release |

### Field guide

| Field    | Meaning                                                                           |
| -------- | --------------------------------------------------------------------------------- |
| Type     | Shared enum: `feat`, `fix`, `hotfix`, `chore`, `docs`, `refactor`, `test`, `idea` |
| Priority | `P0` highest … `P3` lowest                                                        |
| Effort   | `S` / `M` / `L`                                                                   |
| Bump     | Expected SemVer bump for the SPEC: `major` / `minor` / `patch` / `none`           |

---

## Backlog

| ID | Title | Summary | Type | Priority | Effort | Spec | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ------- |

## Speccing

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |

## Ready

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |

## In progress

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |

## In review

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |

## Done

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |
