# World scale & camera defaults

Canonical values for the 3D world live in:

**[`src/lib/world/world-config.ts`](../src/lib/world/world-config.ts)** (`WORLD`)

Change that module when tuning — then update **this doc** so the tables stay accurate. Every key under `WORLD` should appear below.

Units are abstract Three.js **world units** unless noted (the fine grid is 1×1, so treat **1 unit ≈ one minor cell**). Grid stroke widths are an exception: they are **canvas pixels**.

## Ground & grid cells

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `groundSize` | **1000** | Square ground plane edge (`1000×1000`). Mesh follows the look target; texture offset keeps the grid world-locked |
| `gridMinor` | **1** | Fine grid cell (1×1) |
| `gridMajor` | **10** | Mid grid cell (10×10) |
| `gridMega` | **100** | Large grid cell (100×100). One canvas texture tile = one mega cell |

Tiles across one ground edge: `groundSize / gridMega` = **10**.

## Grid appearance (`WORLD.grid`)

Drawn in `GraphScene` (`createGridTexture`). One tile covers one mega cell.

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `grid.textureSize` | **500** | Pixel resolution of one mega-cell tile |
| `grid.fill` | **`#2b3340`** | Ground fill under the lines (near scene bg) |
| `grid.minor.color` | **`#2e3642`** | 1×1 line color |
| `grid.minor.lineWidth` | **1** | 1×1 stroke width (**px** on the tile) |
| `grid.major.color` | **`#313944`** | 10×10 line color |
| `grid.major.lineWidth` | **1** | 10×10 stroke width (**px**) |
| `grid.mega.color` | **`#353e4a`** | 100×100 line color |
| `grid.mega.lineWidth` | **1** | 100×100 stroke width (**px**) |

**Mega seams:** mega lines are drawn only on the **left + top** edges of each tile so adjacent tiles do not double-stroke the same world seam.

## Scene background

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `background` | **`#2a3340`** | Three.js scene background and renderer clear color behind the ground |

## Nodes

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `nodeRadius` | **1** | Default sphere radius |
| `defaultNodeY` | **1** (= `nodeRadius`) | Default Y so nodes sit on the ground plane (`y = 0`) |
| `nodeColor` | **`#7a8a9a`** | Idle node color |
| `nodeSelectedColor` | **`#c4a35a`** | Selected node color |
| `nodeHoverColor` | **`#6eb0c8`** | Pointer-hover node color (not selected) |

## Camera (`WORLD.camera`)

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `camera.defaultDistance` | **50** | Orbit distance at startup / zoom-reset |
| `camera.minDistance` | **2.5** (effective ≈ **4.8**) | Closest zoom. Scene raises this so max pitch still clears `minHeight` |
| `camera.maxDistance` | **200** | Farthest zoom |
| `camera.near` | **0.5** | Perspective near clip |
| `camera.far` | **500** | Perspective far clip |
| `camera.fov` | **50°** | Vertical field of view |
| `camera.defaultPosition` | **≈ (27.08, 32.14, 27.08)** | Startup eye; **40°** above horizon / **50°** from top-down, isometric XZ; length = `defaultDistance` |
| `camera.defaultTarget` | **(0, 0, 0)** | Startup / reset look-at. Pan keeps **target.y = 0** (ground-plane pan, XZ only) |
| `camera.minPolarAngle` | **0.15 rad** | Most top-down allowed (polar from +Y). **Fixed** at runtime |
| `camera.maxPolarAngle` | **π/2 − 0.18** | Most edge-on allowed (~10° above horizon). **Fixed** at runtime |
| `camera.minHeight` | **0.85** | Design height floor for the eye; enforced via raised minDistance + fixed polar caps — not by rewriting `maxPolarAngle` live |

**Controls mapping:** pan = orbit **target** on the ground plane (**XZ only**, `y` stays 0); tilt = spherical **polar** from +Y; zoom = orbit **distance**.

## Labels

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `labelDistance` | **22** | Show a node’s floating label when camera eye is within this world range of the node (World Tune → Camera) |

## Edges (`WORLD.edges`)

Shaft and directed-arrow geometry (world units).

| Constant | Value | Meaning |
| -------- | ----- | ------- |
| `edges.shaftRadius` | **0.1** | Cylinder radius of a committed edge |
| `edges.previewShaftRadius` | **0.2** | Cylinder radius of the connect-mode preview edge |
| `edges.arrowHeight` | **5** | Cone height of the direction arrow |
| `edges.arrowRadius` | **0.5** | Radius of the cone’s wide end (arrow base), world units |
| `edges.arrowGapFraction` | **0.2** (20%) | Arrow center sits this fraction of edge length back from the destination |

## Related

- Scene wiring: `src/lib/world/GraphScene.svelte`
- HUD / add-node height: `src/lib/world/WorldHud.svelte` (`defaultNodeY`)
- Session camera state: `src/lib/session/app.svelte.ts` (reads `WORLD.camera.defaultDistance`)
- Index pointer: `AGENTS.md` → world/camera numeric defaults

