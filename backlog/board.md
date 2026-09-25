# Backlog board

In-repo Kanban. Each card is an `ITEM-XXX`. Details live in the item and `specs/NNN-slug/` pack.
Status moves follow [`docs/PROCESS.md`](../docs/PROCESS.md) (Draft → Accept → execute → PR → Done).

**Approvals:** only an authorized project owner/reviewer promotes to Ready, Accepts Drafts, authorizes execute, approves merge PRs, and cuts `main` / tags when needed.

**Archive:** [`archives.md`](./archives.md) (not a column). Done = merged; versioned slices tag on the `main` cut per PROCESS.

### Column meanings

| Column      | Meaning                                             |
| ----------- | --------------------------------------------------- |
| Backlog     | Captured — no complete spec yet                     |
| Speccing    | Spec pack in progress                               |
| Ready       | DoR met + owner Accept — may execute                |
| In progress | Execution started — feature/hotfix branch           |
| In review   | PR open — awaiting approval                         |
| Done        | Merged; versioned slices tag when owner cuts `main` |

### Field guide

| Field    | Meaning                                                                           |
| -------- | --------------------------------------------------------------------------------- |
| Type     | Shared enum: `feat`, `fix`, `hotfix`, `chore`, `docs`, `refactor`, `test`, `idea` |
| Priority | `P0` highest … `P3` lowest                                                        |
| Effort   | `S` / `M` / `L`                                                                   |
| Bump     | SemVer bump for the slice: `major` / `minor` / `patch` / `none`                   |

---

## Backlog

| ID  | Title | Summary | Type | Priority | Effort | Spec | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ------- |

## Speccing

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |

## Ready

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |

## In progress

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |

## In review

| ID       | Title                   | Summary                                                         | Type | Priority | Effort | Spec                                                | Bump  | PR  | Updated    |
| -------- | ----------------------- | --------------------------------------------------------------- | ---- | -------- | ------ | --------------------------------------------------- | ----- | --- | ---------- |
| ITEM-047 | Shared tags + Tags tool | Shared vocabulary, charset strip, Tags tool focus/rename/delete | feat | P1       | L      | [047-shared-tags](../specs/047-shared-tags/spec.md) | minor | 22  | 2026-09-26 |

## Done

| ID       | Title                             | Summary                                        | Type | Priority | Effort | Spec                                                                                        | Bump  | Merged     | Updated    |
| -------- | --------------------------------- | ---------------------------------------------- | ---- | -------- | ------ | ------------------------------------------------------------------------------------------- | ----- | ---------- | ---------- |
| ITEM-039 | World-first shell + HUD           | Full-bleed world + floating HUD; no World Tune | feat | P1       | M      | [039-world-first-shell-hud](../specs/039-world-first-shell-hud/spec.md)                     | minor | 2026-09-25 | 2026-09-25 |
| ITEM-040 | Canonical world config            | Frozen WORLD + synced world-scale; file-only   | feat | P1       | M      | [040-canonical-world-config](../specs/040-canonical-world-config/spec.md)                   | minor | 2026-09-25 | 2026-09-25 |
| ITEM-041 | Camera chrome + 2D/3D             | Map chrome, 2D/3D toggle, cursor rules         | feat | P1       | M      | [041-camera-chrome-2d-3d](../specs/041-camera-chrome-2d-3d/spec.md)                         | minor | 2026-09-25 | 2026-09-25 |
| ITEM-042 | Solid nodes + pointer intents     | Collision, select/multi/move/connect           | feat | P1       | M      | [042-solid-nodes-pointer-intents](../specs/042-solid-nodes-pointer-intents/spec.md)         | minor | 2026-09-25 | 2026-09-25 |
| ITEM-043 | Labels, colors, edge geometry     | LOD labels, palette, WORLD.edges               | feat | P1       | M      | [043-labels-colors-edge-geometry](../specs/043-labels-colors-edge-geometry/spec.md)         | minor | 2026-09-25 | 2026-09-25 |
| ITEM-044 | In-world selection sheet + create | Inspector, HUD create, delete/connect          | feat | P1       | M      | [044-in-world-selection-sheet-create](../specs/044-in-world-selection-sheet-create/spec.md) | minor | 2026-09-25 | 2026-09-25 |
| ITEM-045 | Toolbar + tools panel chrome      | Icon rail, sticky glass tools panel            | feat | P1       | M      | [045-toolbar-tools-panel-chrome](../specs/045-toolbar-tools-panel-chrome/spec.md)           | minor | 2026-09-25 | 2026-09-25 |
| ITEM-046 | Manager Nodes/Edges list UX       | Search, Edges filter, companion sheet          | feat | P1       | M      | [046-manager-nodes-edges-list-ux](../specs/046-manager-nodes-edges-list-ux/spec.md)         | minor | 2026-09-25 | 2026-09-25 |
