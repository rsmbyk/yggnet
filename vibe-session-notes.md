# Vibe session notes — 2026-07-30 (updated 2026-09-25)

**Branch:** `vibe/session-20260730` (off `develop`, tip before vibe was `c6cdd5c`)  
**Status:** **Concluded / formalizing** — specs 039…046 (ITEM-039…046); draft PR #16 to `develop`.  
**Dev:** `npm run dev` → `http://localhost:5174/` (`strictPort`).

---

## Formalization

Vibe exploration is frozen into normal process packs:

| SPEC                                | Concern                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| 039-world-first-shell-hud           | World-first shell + HUD                                   |
| 040-canonical-world-config          | Canonical world config (no World Tune; `textureSize` 250) |
| 041-camera-chrome-2d-3d             | Camera chrome + 2D/3D                                     |
| 042-solid-nodes-pointer-intents     | Solid nodes + pointer intents                             |
| 043-labels-colors-edge-geometry     | Labels, colors, edge geometry                             |
| 044-in-world-selection-sheet-create | In-world selection sheet + create                         |
| 045-toolbar-tools-panel-chrome      | Toolbar + tools panel chrome                              |
| 046-manager-nodes-edges-list-ux     | Manager Nodes/Edges list UX                               |

**World config:** edit [`src/lib/world/world-config.ts`](src/lib/world/world-config.ts) and keep [`docs/world-scale.md`](docs/world-scale.md) in sync. There is **no** live World Tune panel or `/__yggnet/world-config` writer.

Characterization tests lock shipped behavior; product code stays as on the vibe tip except 040-canonical-world-config intentional deltas.

---

## Distinct features (mapped to SPECs)

1. **World-first shell** — 039-world-first-shell-hud
2. **World HUD menubar** — 039-world-first-shell-hud
3. **In-world selection sheet** — 044-in-world-selection-sheet-create
4. **In-world create/connect/delete** — 042-solid-nodes-pointer-intents / 044-in-world-selection-sheet-create
5. **Toolbar** — 045-toolbar-tools-panel-chrome
6. **Glass panels + calm motion** — 045-toolbar-tools-panel-chrome
7. **World config file** — 040-canonical-world-config (was Tune → Save; now file-only)
8. **Solid nodes** — 042-solid-nodes-pointer-intents
9. **Node click / connect intents** — 042-solid-nodes-pointer-intents
10. **Labels** — 043-labels-colors-edge-geometry
11. **Node colors** — 043-labels-colors-edge-geometry
12. **Camera chrome** — 041-camera-chrome-2d-3d
13. **2D / 3D view toggle** — 041-camera-chrome-2d-3d
14. **Cursor** — 041-camera-chrome-2d-3d

---

## 2D / 3D view (behavior)

| Mode       | Behavior                                                                                                                                                                                             |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **3D**     | Free LMB orbit; RMB pan (XZ default; Ctrl XY; Shift YZ); wheel zoom.                                                                                                                                 |
| **2D**     | True top-down on XZ plane: eye on +Y above target, `up = (0,0,-1)` so screen X = world +X, screen vertical ≈ world −Z. Orbit disabled. Pan + node move **XZ only**. Nodes on floor (`defaultNodeY`). |
| **Toggle** | `app.toggleViewMode()` — saves `last3dOrbit.offset` when entering 2D from settled Y-up 3D; restores offset scaled to current zoom when leaving 2D; **keeps current zoom**.                           |
| **Tween**  | `viewModeTransitionMs` in `WORLD.controls`; quaternion + position tween on render loop; `prefers-reduced-motion` → instant.                                                                          |

**Key code:** `app.svelte.ts` (`ui.viewMode`, `last3dOrbit`, `viewModeEpoch`), `GraphScene.svelte`, `WorldCanvas.svelte`.

---

## Mouse controls (locked 2026-08-01)

### Camera

| Input                    | Action                                          |
| ------------------------ | ----------------------------------------------- |
| **LMB drag** empty space | Orbit — **disabled in 2D**                      |
| **RMB drag** empty space | Pan (XZ; Ctrl→XY; Shift→YZ) — **XZ only in 2D** |
| **Wheel**                | Zoom                                            |
| **2D / 3D toggle**       | See table above                                 |

### Select / multi-select

| Input                     | Action                                                |
| ------------------------- | ----------------------------------------------------- |
| **LMB click** node        | Select (replace); exits sticky multi                  |
| **LMB click** empty space | Clear **single** selection (not sticky multi with 2+) |
| **Shift+LMB click** node  | Add; **enters sticky multi-select**                   |
| Multi: **LMB click**      | Toggle                                                |
| Multi: **Alt+LMB click**  | Deselect only                                         |
| **RMB click** (no drag)   | Cancel / clear multi-select                           |
| Multi / connect           | **No node move** — click intents only                 |

### Move

| Input                | Action                              |
| -------------------- | ----------------------------------- |
| **LMB drag** node    | Move: XZ / Ctrl→XY / Shift→YZ       |
| **Alt** while moving | Snap (`collision.snapStep`)         |
| **RMB** while moving | Cancel move                         |
| Collision            | No overlap other nodes; floor clamp |

### Connect

| Input                         | Action                              |
| ----------------------------- | ----------------------------------- |
| **Ctrl+LMB click**            | Connect from selection (undirected) |
| **Ctrl+Alt+LMB click**        | Connect directed (locked)           |
| Hold **Alt** while connecting | Promote to directed                 |
| **LMB** on destination        | Complete edge                       |
| **RMB** / **Esc** / Cancel    | End connect                         |

---

## Key files (quick map)

| Area                       | Path                                                  |
| -------------------------- | ----------------------------------------------------- |
| App / camera / view mode   | `src/lib/session/app.svelte.ts`                       |
| World scene + input        | `src/lib/world/GraphScene.svelte`                     |
| HUD + minimap + cam chrome | `src/lib/world/WorldHud.svelte`, `WorldCanvas.svelte` |
| Canonical config           | `src/lib/world/world-config.ts`                       |
| Node collision             | `src/lib/world/node-physics.ts`                       |
| Click intents              | `src/lib/world/node-click.ts`                         |
| Shell route                | `src/routes/+page.svelte`                             |
| Manager drawer             | `src/lib/ui/ManagerPanel.svelte`                      |
