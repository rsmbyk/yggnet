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
| [ITEM-029](items/ITEM-029.md) | Multi-select nodes (and edges) | Multi-id selection synced across manager and world; foundation for groups. | feat | P1 | M | [SPEC-029](../docs/specs/SPEC-029/spec.md) | minor | 2026-07-30 |
| [ITEM-030](items/ITEM-030.md) | Multi-node groups from UI | Create/collapse/expand district groups from 2+ selected nodes. | feat | P1 | M | [SPEC-030](../docs/specs/SPEC-030/spec.md) | minor | 2026-07-30 |
| [ITEM-031](items/ITEM-031.md) | Directed edge visuals in world | Show direction cues on directed edges in Threlte (technical look). | feat | P1 | S | [SPEC-031](../docs/specs/SPEC-031/spec.md) | patch | 2026-07-30 |
| [ITEM-032](items/ITEM-032.md) | Node drag / position edit | Drag or edit node positions; persist and undo. | feat | P1 | M | [SPEC-032](../docs/specs/SPEC-032/spec.md) | minor | 2026-07-30 |
| [ITEM-033](items/ITEM-033.md) | Pin respected by layout | Re-layout moves unpinned nodes; pinned stay fixed. | feat | P2 | M | [SPEC-033](../docs/specs/SPEC-033/spec.md) | minor | 2026-07-30 |
| [ITEM-034](items/ITEM-034.md) | Compare algorithms dual view | Distinguishable dual/side-by-side compare of two algos on same A–B. | feat | P2 | M | [SPEC-034](../docs/specs/SPEC-034/spec.md) | minor | 2026-07-30 |
| [ITEM-035](items/ITEM-035.md) | Compare stored runs dual view | Dual/side-by-side compare of two stored runs. | feat | P2 | M | [SPEC-035](../docs/specs/SPEC-035/spec.md) | minor | 2026-07-30 |
| [ITEM-036](items/ITEM-036.md) | Step annotations readback + playback | Show saved step notes; play/pause cached trace. | feat | P1 | M | [SPEC-036](../docs/specs/SPEC-036/spec.md) | minor | 2026-07-30 |
| [ITEM-037](items/ITEM-037.md) | Attachments on nodes and edges | Add/list/remove local attachments in manager. | feat | P2 | M | [SPEC-037](../docs/specs/SPEC-037/spec.md) | minor | 2026-07-30 |
| [ITEM-038](items/ITEM-038.md) | Save/load named docs + palette find | Named slots or file download/open; palette query jump. | feat | P2 | M | [SPEC-038](../docs/specs/SPEC-038/spec.md) | minor | 2026-07-30 |


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
