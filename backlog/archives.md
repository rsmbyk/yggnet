# Archives

Items that left the active board (released, cancelled, superseded, etc.).
Newest first. One row per item.

### Reasons

| Reason       | Meaning                                              |
| ------------ | ---------------------------------------------------- |
| `released`   | Shipped in a production release                      |
| `cancelled`  | Dropped (may never have been readied or implemented) |
| `superseded` | Replaced by another item/spec                        |
| `wontfix`    | Decided not to do                                    |
| `duplicate`  | Same as another item                                 |

---

## Archived

| Archived (ISO) | ID  | Title | Summary | Type | Priority | Effort | Spec | Reason | Version | PR  | Notes |
| -------------- | --- | ----- | ------- | ---- | -------- | ------ | ---- | ------ | ------- | --- | ----- |
| 2026-07-30 | ITEM-029 | Multi-select nodes (and edges) | Support selecting multiple nodes (and edges) so manager and world stay in sync on a multi-id selection. Required foundation for real multi-node groups. | feat | P1 | M | SPEC-029 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-030 | Multi-node groups from UI | Create, collapse, and expand district groups from a multi-node selection so groups are usable from the UI, not only via one-node API calls. | feat | P1 | M | SPEC-030 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-031 | Directed edge visuals in world | Show clear direction on directed edges in the Threlte world so the directed flag is visible, not only in the manager. | feat | P1 | S | SPEC-031 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-032 | Node drag / position edit | Let users place nodes deliberately by dragging in the world and/or editing position in the manager; positions persist and are undoable. | feat | P1 | M | SPEC-032 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-033 | Pin respected by layout | Provide a minimal layout (or re-layout action) that moves unpinned nodes and leaves pinned nodes fixed, so pin is a real product behavior. | feat | P2 | M | SPEC-033 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-034 | Compare algorithms dual view | Compare two algorithms on the same A–B (or same action) with a distinguishable dual overlay or side-by-side result, not a single merged soup. | feat | P2 | M | SPEC-034 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-035 | Compare stored runs dual view | Pick two stored algorithm runs and view them as a dual overlay or side-by-side comparison, not a single merged overlay. | feat | P2 | M | SPEC-035 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-036 | Step annotations readback + playback | Show saved step annotations when scrubbing a cached trace, and provide play/pause auto-advance over that trace without re-running the algorithm. | feat | P1 | M | SPEC-036 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-037 | Attachments on nodes and edges | Add, list, and remove local attachments on nodes and edges from the manager. Notes already work; attachment UI does not. | feat | P2 | M | SPEC-037 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-038 | Save/load named docs + palette find | Improve persist UX with named save slots and/or download/open file, and wire the command palette find path to query nodes and jump to them. | feat | P2 | M | SPEC-038 | released | 0.30.0 | #15 | hardening after 0.21.1 |
| 2026-07-30 | ITEM-001 | Manager graph CRUD | Add/edit/remove nodes and edges in the manager; disconnected graphs are valid. | feat | P0 | L | SPEC-001 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-002 | Edge weight + directed | First-class directed flag and numeric weight on edges in the model and manager. | feat | P0 | M | SPEC-002 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-024 | Undo / redo | Command-stack undo and redo for graph edits. | feat | P0 | L | SPEC-024 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-004 | World graph render | Draw nodes and edges in Threlte from GraphDocument with a technical visual language. | feat | P0 | L | SPEC-004 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-003 | Explore bird's-eye camera | RTS/SimCity bird's-eye pan, zoom, light orbit; overview and street-level altitude. | feat | P0 | L | SPEC-003 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-005 | Selection sync | Manager and world share selection through the graph selection API. | feat | P0 | M | SPEC-005 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-006 | Pathfinder A to B | All simple paths by default; shortest mode (all ties); pick a path; technical highlight. | feat | P0 | L | SPEC-006 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-007 | Directions guided travel | Google-style camera travel along the selected path with clear exit to Explore. | feat | P0 | M | SPEC-007 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-008 | Follow edge | One-hop mini-Directions: ride a chosen relationship to the neighbor. | feat | P1 | S | SPEC-008 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-009 | Algorithm registry + picker | Pluggable algorithm registry and extensive shortest-path (then graph actions) picker. | feat | P1 | L | SPEC-009 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-010 | Cached traces + step replay | Show algorithm result first; keep step trace; Show steps replays without re-run. | feat | P1 | L | SPEC-010 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-011 | Stale-run invalidation | Graph edits mark runs and traces stale until the algorithm is re-run. | feat | P1 | M | SPEC-011 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-015 | Pin / anchor nodes | Freeze important node positions so layout does not shove them. | feat | P1 | S | SPEC-015 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-016 | Groups / containers | Collapse and expand subgraphs as district containers. | feat | P1 | L | SPEC-016 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-017 | Filters by type/tag | Show or hide graph elements by type, tag, or status. | feat | P1 | M | SPEC-017 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-021 | Save / load graph | Explicit save and open for a graph document. | feat | P1 | M | SPEC-021 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-022 | Autosave | Quiet local persistence so refresh does not lose the graph. | feat | P1 | S | SPEC-022 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-023 | Import / export JSON | Import and export portable GraphDocument JSON. | feat | P1 | M | SPEC-023 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-025 | Command palette | Keyboard command palette for find, navigate, algos, directions, and more. | feat | P1 | M | SPEC-025 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-012 | Algo compare | Compare different algorithms on the same Aâ€“B (or same action). | feat | P1 | M | SPEC-012 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-013 | Compare runs | Side-by-side or dual overlays from stored algorithm runs. | feat | P1 | M | SPEC-013 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-018 | Diff two nodes | Side-by-side metadata compare plus path highlight between two nodes. | feat | P2 | M | SPEC-018 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-019 | LOD labels | Node labels appear when zoomed in toward street level. | feat | P2 | S | SPEC-019 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-020 | Minimap | Bird's-eye radar of the graph; click to pan the main view. | feat | P2 | M | SPEC-020 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-014 | Annotate algorithm steps | Pin notes to individual steps of a cached algorithm trace. | feat | P2 | M | SPEC-014 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-026 | Notes and attachments | Notes and attachments on both nodes and edges. | feat | P2 | L | SPEC-026 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-027 | Templates + random graph | Starter templates (org, roadmap, learning, blank) and generate-random graph. | feat | P2 | M | SPEC-027 | released | 0.21.1 | #3 | initial MVP release |
| 2026-07-30 | ITEM-028 | Simple clean modern chrome | Quiet manager, Directions, and Analyze panels with progressive disclosure. | feat | P2 | M | SPEC-028 | released | 0.21.1 | #3 | initial MVP release |
