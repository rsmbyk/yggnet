# Vibe session notes — 2026-07-30 (updated 2026-08-03)

**Branch:** `vibe/session-20260730` (off `develop`, tip before vibe was `c6cdd5c`)  
**Status:** Paused for machine migration — work committed on vibe branch; **not merged to `develop`**.  
**Dev:** `npm run dev` → usually `http://localhost:5174/` (Vite picks port if 5173 busy).

---

## Pick up on a new machine

```bash
git fetch origin
git checkout vibe/session-20260730
npm install
npm run dev
```

Read this file + skim `src/lib/world/world-config.ts` and `GraphScene.svelte` for camera/input.  
World Tune panel (HUD) edits live; **Save** writes `world-config.ts` via dev middleware `POST /__yggnet/world-config` (`scripts/vite-world-config-writer.ts`, wired in `vite.config.ts`).

When vibe session truly ends: split into Backlog ITEMs on clean `develop`, keep this branch as reference until ITEMs are Done, then SPEC execute (same behavior, with tests).

---

## Distinct features to split into ITEMs later

1. **World-first shell** — Full-bleed 3D world as primary UI; remove permanent admin sidebar.
2. **World HUD chrome** — Floating top bar: brand, undo/redo, add node, palette, World tune, Advanced.
3. **In-world selection sheet** — Bottom-left inspector for selected node/edge (label, connect, pin, delete).
4. **In-world create/connect/delete** — Add node; Connect mode; Del/Backspace; Esc cancels.
5. **Advanced manager as drawer** — Closed by default; right overlay for large-scale work (`ManagerPanel.svelte`).
6. **Glass panels + calm motion** — Translucent panels; fade/fly ~160–220ms; `prefers-reduced-motion`.
7. **World Tune → config file** — All `WORLD` knobs live; Save writes `src/lib/world/world-config.ts`.
8. **Solid nodes** — Kinematic collision (`node-physics.ts`); no gravity; floor clamp; `findFreePosition` on add.
9. **Node click / connect intents** — `node-click.ts` + sticky multi-select, Ctrl connect, Alt directed.
10. **Labels** — Billboard, screen-up offset, LOD by `labelDistance` (eye→node), depthTest off, pass through edges.
11. **Node colors** — Idle / selected / hover in World Tune; connect source uses selected color.
12. **Camera chrome** — Reset target / orbit / zoom; minimap; readout (pan, tilt, eye xyz).
13. **2D / 3D view toggle** — Map chrome first button; see below.
14. **Cursor** — Grab on empty space; default arrow on nodes; grabbing while pan/orbit/drag.

---

## 2D / 3D view (latest behavior)

| Mode | Behavior |
|------|----------|
| **3D** | Free LMB orbit; RMB pan (XZ default; Ctrl XY; Shift YZ); wheel zoom. |
| **2D** | True top-down on XZ plane: eye on +Y above target, `up = (0,0,-1)` so screen X = world +X, screen vertical ≈ world −Z. Orbit disabled. Pan + node move **XZ only**. Nodes on floor (`defaultNodeY`). |
| **Toggle** | `app.toggleViewMode()` — saves `last3dOrbit.offset` (eye−target) when entering 2D from settled Y-up 3D; restores offset scaled to current zoom when leaving 2D; **keeps current zoom**. |
| **Tween** | `viewModeTransitionMs` in World Tune; quaternion + position tween on render loop (`useTask`); `prefers-reduced-motion` → instant. |

**Key code:** `app.svelte.ts` (`ui.viewMode`, `last3dOrbit`, `viewModeEpoch`), `GraphScene.svelte` (`enforce2dCamera`, `animateViewModeTransition`), `WorldCanvas.svelte` (toggle button).

**Polish / verify on new machine:** 2D transition feel; rapid toggle mash; 3D restore matches pre-2D view; label readability in 2D.

---

## Session rule — World Tune

Any tunable value → **World Tune** + `WORLD` / `world-config.ts`. Canonical scale doc: `docs/world-scale.md`.

---

## Mouse controls (locked 2026-08-01)

### Camera
| Input | Action |
|---|---|
| **LMB drag** empty space | Orbit — **disabled in 2D** |
| **RMB drag** empty space | Pan (XZ; Ctrl→XY; Shift→YZ) — **XZ only in 2D** |
| **Wheel** | Zoom |
| **2D / 3D toggle** | See table above |

### Select / multi-select
| Input | Action |
|---|---|
| **LMB click** node | Select (replace); exits sticky multi |
| **LMB click** empty space | Clear **single** selection (not sticky multi with 2+) |
| **Shift+LMB click** node | Add; **enters sticky multi-select** |
| Multi: **LMB click** | Toggle |
| Multi: **Alt+LMB click** | Deselect only |
| **RMB click** (no drag) | Cancel / clear multi-select |
| Multi / connect | **No node move** — click intents only |

### Move
| Input | Action |
|---|---|
| **LMB drag** node | Move: XZ / Ctrl→XY / Shift→YZ |
| **Alt** while moving | Snap (`collision.snapStep`) |
| **RMB** while moving | Cancel move (window capture + `buttons` bit) |
| Collision | No overlap other nodes; floor clamp |

### Connect
| Input | Action |
|---|---|
| **Ctrl+LMB click** | Connect from selection (undirected) |
| **Ctrl+Alt+LMB click** | Connect directed (locked) |
| Hold **Alt** while connecting | Promote to directed |
| **LMB** on destination | Complete edge |
| **RMB** / **Esc** / Cancel | End connect |

---

## Key files (quick map)

| Area | Path |
|------|------|
| App / camera / view mode | `src/lib/session/app.svelte.ts` |
| World scene + input | `src/lib/world/GraphScene.svelte` |
| HUD + minimap + cam chrome | `src/lib/world/WorldHud.svelte`, `WorldCanvas.svelte` |
| World Tune UI | `src/lib/world/WorldTunePanel.svelte`, `world-tune.svelte.ts` |
| Canonical config | `src/lib/world/world-config.ts` |
| Node collision | `src/lib/world/node-physics.ts` |
| Click intents | `src/lib/world/node-click.ts` |
| Shell route | `src/routes/+page.svelte` |
| Manager drawer | `src/lib/ui/ManagerPanel.svelte` |

---

## Vibe session rules (for continuity)

- Code immediately for HMR; **tests skipped** during vibe (one `node-click.test.ts` exists but not part of vibe gate).
- **No merge to `develop`** until ITEMs + SPEC execute.
- Commit on vibe branch OK for handoff (this snapshot).
- End of session → backlog ITEMs on `develop`, vibe branch stays as reference.
