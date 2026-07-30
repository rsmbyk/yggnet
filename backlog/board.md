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
| [ITEM-034](items/ITEM-034.md) | Compare algorithms dual view | Compare two algorithms on the same A–B (or same action) with a distinguishable dual overlay or side-by-side result, not a single merged soup. | feat | P2 | M | [SPEC-034](../docs/specs/SPEC-034/spec.md) | minor | 2026-07-30 |
| [ITEM-035](items/ITEM-035.md) | Compare stored runs dual view | Pick two stored algorithm runs and view them as a dual overlay or side-by-side comparison, not a single merged overlay. | feat | P2 | M | [SPEC-035](../docs/specs/SPEC-035/spec.md) | minor | 2026-07-30 |
| [ITEM-036](items/ITEM-036.md) | Step annotations readback + playback | Show saved step annotations when scrubbing a cached trace, and provide play/pause auto-advance over that trace without re-running the algorithm. | feat | P1 | M | [SPEC-036](../docs/specs/SPEC-036/spec.md) | minor | 2026-07-30 |
| [ITEM-037](items/ITEM-037.md) | Attachments on nodes and edges | Add, list, and remove local attachments on nodes and edges from the manager. Notes already work; attachment UI does not. | feat | P2 | M | [SPEC-037](../docs/specs/SPEC-037/spec.md) | minor | 2026-07-30 |
| [ITEM-038](items/ITEM-038.md) | Save/load named docs + palette find | Improve persist UX with named save slots and/or download/open file, and wire the command palette find path to query nodes and jump to them. | feat | P2 | M | [SPEC-038](../docs/specs/SPEC-038/spec.md) | minor | 2026-07-30 |

## In progress

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |

## In review

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |

## Done

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |
| [ITEM-029](items/ITEM-029.md) | Multi-select nodes (and edges) | Support selecting multiple nodes (and edges) so manager and world stay in sync on a multi-id selection. Required foundation for real multi-node groups. | feat | P1 | M | [SPEC-029](../docs/specs/SPEC-029/spec.md) | minor | 2026-07-30 | 2026-07-30 |
| [ITEM-030](items/ITEM-030.md) | Multi-node groups from UI | Create, collapse, and expand district groups from a multi-node selection so groups are usable from the UI, not only via one-node API calls. | feat | P1 | M | [SPEC-030](../docs/specs/SPEC-030/spec.md) | minor | 2026-07-30 | 2026-07-30 |
| [ITEM-031](items/ITEM-031.md) | Directed edge visuals in world | Show clear direction on directed edges in the Threlte world so the directed flag is visible, not only in the manager. | feat | P1 | S | [SPEC-031](../docs/specs/SPEC-031/spec.md) | patch | 2026-07-30 | 2026-07-30 |
| [ITEM-032](items/ITEM-032.md) | Node drag / position edit | Let users place nodes deliberately by dragging in the world and/or editing position in the manager; positions persist and are undoable. | feat | P1 | M | [SPEC-032](../docs/specs/SPEC-032/spec.md) | minor | 2026-07-30 | 2026-07-30 |
| [ITEM-033](items/ITEM-033.md) | Pin respected by layout | Provide a minimal layout (or re-layout action) that moves unpinned nodes and leaves pinned nodes fixed, so pin is a real product behavior. | feat | P2 | M | [SPEC-033](../docs/specs/SPEC-033/spec.md) | minor | 2026-07-30 | 2026-07-30 |
