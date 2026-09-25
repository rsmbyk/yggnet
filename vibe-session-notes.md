# Vibe session notes — 2026-07-30 (updated 2026-09-25)

**Branch:** `vibe/session-20260730` (off `develop`, tip before vibe was `c6cdd5c`)  
**Status:** **Concluded / formalizing** — SPECs ITEM/SPEC-039…046; draft PR #16 to `develop`.  
**Dev:** `npm run dev` → `http://localhost:5174/` (`strictPort`).

---

## Formalization

Vibe exploration is frozen into normal process packs:

| SPEC     | Concern                                                   |
| -------- | --------------------------------------------------------- |
| SPEC-039 | World-first shell + HUD                                   |
| SPEC-040 | Canonical world config (no World Tune; `textureSize` 250) |
| SPEC-041 | Camera chrome + 2D/3D                                     |
| SPEC-042 | Solid nodes + pointer intents                             |
| SPEC-043 | Labels, colors, edge geometry                             |
| SPEC-044 | In-world selection sheet + create                         |
| SPEC-045 | Toolbar + tools panel chrome                              |
| SPEC-046 | Manager Nodes/Edges list UX                               |

**World config:** edit [`src/lib/world/world-config.ts`](src/lib/world/world-config.ts) and keep [`docs/world-scale.md`](docs/world-scale.md) in sync. There is **no** live World Tune panel or `/__yggnet/world-config` writer.

Characterization tests lock shipped behavior; product code stays as on the vibe tip except SPEC-040 intentional deltas.

---

## Distinct features (mapped to SPECs)

1. **World-first shell** — SPEC-039
2. **World HUD menubar** — SPEC-039
3. **In-world selection sheet** — SPEC-044
4. **In-world create/connect/delete** — SPEC-042 / SPEC-044
5. **Toolbar** — SPEC-045
6. **Glass panels + calm motion** — SPEC-045
7. **World config file** — SPEC-040 (was Tune → Save; now file-only)
8. **Solid nodes** — SPEC-042
9. **Node click / connect intents** — SPEC-042
10. **Labels** — SPEC-043
11. **Node colors** — SPEC-043
12. **Camera chrome** — SPEC-041
13. **2D / 3D view toggle** — SPEC-041
14. **Cursor** — SPEC-041

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
