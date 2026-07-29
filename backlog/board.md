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

| ID  | Title | Summary | Type | Priority | Effort | Spec | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ------- |

## Speccing

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |

## Ready

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |
| [ITEM-001](items/ITEM-001.md) | Manager graph CRUD | Add/edit/remove nodes and edges in the manager; disconnected graphs are valid. | feat | P0 | L | [SPEC-001](../docs/specs/SPEC-001/spec.md) | minor | 2026-07-30 |
| [ITEM-002](items/ITEM-002.md) | Edge weight + directed | First-class directed flag and numeric weight on edges in the model and manager. | feat | P0 | M | [SPEC-002](../docs/specs/SPEC-002/spec.md) | minor | 2026-07-30 |
| [ITEM-003](items/ITEM-003.md) | Explore bird's-eye camera | RTS/SimCity bird's-eye pan, zoom, light orbit; overview and street-level altitude. | feat | P0 | L | [SPEC-003](../docs/specs/SPEC-003/spec.md) | minor | 2026-07-30 |
| [ITEM-004](items/ITEM-004.md) | World graph render | Draw nodes and edges in Threlte from GraphDocument with a technical visual language. | feat | P0 | L | [SPEC-004](../docs/specs/SPEC-004/spec.md) | minor | 2026-07-30 |
| [ITEM-005](items/ITEM-005.md) | Selection sync | Manager and world share selection through the graph selection API. | feat | P0 | M | [SPEC-005](../docs/specs/SPEC-005/spec.md) | minor | 2026-07-30 |
| [ITEM-006](items/ITEM-006.md) | Pathfinder A to B | All simple paths by default; shortest mode (all ties); pick a path; technical highlight. | feat | P0 | L | [SPEC-006](../docs/specs/SPEC-006/spec.md) | minor | 2026-07-30 |
| [ITEM-007](items/ITEM-007.md) | Directions guided travel | Google-style camera travel along the selected path with clear exit to Explore. | feat | P0 | M | [SPEC-007](../docs/specs/SPEC-007/spec.md) | minor | 2026-07-30 |
| [ITEM-024](items/ITEM-024.md) | Undo / redo | Command-stack undo and redo for graph edits. | feat | P0 | L | [SPEC-024](../docs/specs/SPEC-024/spec.md) | minor | 2026-07-30 |
| [ITEM-008](items/ITEM-008.md) | Follow edge | One-hop mini-Directions: ride a chosen relationship to the neighbor. | feat | P1 | S | [SPEC-008](../docs/specs/SPEC-008/spec.md) | patch | 2026-07-30 |
| [ITEM-009](items/ITEM-009.md) | Algorithm registry + picker | Pluggable algorithm registry and extensive shortest-path (then graph actions) picker. | feat | P1 | L | [SPEC-009](../docs/specs/SPEC-009/spec.md) | minor | 2026-07-30 |
| [ITEM-010](items/ITEM-010.md) | Cached traces + step replay | Show algorithm result first; keep step trace; Show steps replays without re-run. | feat | P1 | L | [SPEC-010](../docs/specs/SPEC-010/spec.md) | minor | 2026-07-30 |
| [ITEM-011](items/ITEM-011.md) | Stale-run invalidation | Graph edits mark runs and traces stale until the algorithm is re-run. | feat | P1 | M | [SPEC-011](../docs/specs/SPEC-011/spec.md) | patch | 2026-07-30 |
| [ITEM-012](items/ITEM-012.md) | Algo compare | Compare different algorithms on the same A–B (or same action). | feat | P1 | M | [SPEC-012](../docs/specs/SPEC-012/spec.md) | minor | 2026-07-30 |
| [ITEM-013](items/ITEM-013.md) | Compare runs | Side-by-side or dual overlays from stored algorithm runs. | feat | P1 | M | [SPEC-013](../docs/specs/SPEC-013/spec.md) | minor | 2026-07-30 |
| [ITEM-015](items/ITEM-015.md) | Pin / anchor nodes | Freeze important node positions so layout does not shove them. | feat | P1 | S | [SPEC-015](../docs/specs/SPEC-015/spec.md) | patch | 2026-07-30 |
| [ITEM-016](items/ITEM-016.md) | Groups / containers | Collapse and expand subgraphs as district containers. | feat | P1 | L | [SPEC-016](../docs/specs/SPEC-016/spec.md) | minor | 2026-07-30 |
| [ITEM-017](items/ITEM-017.md) | Filters by type/tag | Show or hide graph elements by type, tag, or status. | feat | P1 | M | [SPEC-017](../docs/specs/SPEC-017/spec.md) | minor | 2026-07-30 |
| [ITEM-021](items/ITEM-021.md) | Save / load graph | Explicit save and open for a graph document. | feat | P1 | M | [SPEC-021](../docs/specs/SPEC-021/spec.md) | minor | 2026-07-30 |
| [ITEM-022](items/ITEM-022.md) | Autosave | Quiet local persistence so refresh does not lose the graph. | feat | P1 | S | [SPEC-022](../docs/specs/SPEC-022/spec.md) | patch | 2026-07-30 |
| [ITEM-023](items/ITEM-023.md) | Import / export JSON | Import and export portable GraphDocument JSON. | feat | P1 | M | [SPEC-023](../docs/specs/SPEC-023/spec.md) | minor | 2026-07-30 |
| [ITEM-025](items/ITEM-025.md) | Command palette | Keyboard command palette for find, navigate, algos, directions, and more. | feat | P1 | M | [SPEC-025](../docs/specs/SPEC-025/spec.md) | minor | 2026-07-30 |
| [ITEM-014](items/ITEM-014.md) | Annotate algorithm steps | Pin notes to individual steps of a cached algorithm trace. | feat | P2 | M | [SPEC-014](../docs/specs/SPEC-014/spec.md) | patch | 2026-07-30 |
| [ITEM-018](items/ITEM-018.md) | Diff two nodes | Side-by-side metadata compare plus path highlight between two nodes. | feat | P2 | M | [SPEC-018](../docs/specs/SPEC-018/spec.md) | minor | 2026-07-30 |
| [ITEM-019](items/ITEM-019.md) | LOD labels | Node labels appear when zoomed in toward street level. | feat | P2 | S | [SPEC-019](../docs/specs/SPEC-019/spec.md) | patch | 2026-07-30 |
| [ITEM-020](items/ITEM-020.md) | Minimap | Bird's-eye radar of the graph; click to pan the main view. | feat | P2 | M | [SPEC-020](../docs/specs/SPEC-020/spec.md) | minor | 2026-07-30 |
| [ITEM-026](items/ITEM-026.md) | Notes and attachments | Notes and attachments on both nodes and edges. | feat | P2 | L | [SPEC-026](../docs/specs/SPEC-026/spec.md) | minor | 2026-07-30 |
| [ITEM-027](items/ITEM-027.md) | Templates + random graph | Starter templates (org, roadmap, learning, blank) and generate-random graph. | feat | P2 | M | [SPEC-027](../docs/specs/SPEC-027/spec.md) | minor | 2026-07-30 |
| [ITEM-028](items/ITEM-028.md) | Simple clean modern chrome | Quiet manager, Directions, and Analyze panels with progressive disclosure. | feat | P2 | M | [SPEC-028](../docs/specs/SPEC-028/spec.md) | patch | 2026-07-30 |

## In progress

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |

## In review

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |

## Done

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |
