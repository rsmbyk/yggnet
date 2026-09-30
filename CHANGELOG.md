# Changelog

All notable changes to Yggnet will be documented here.

Format inspired by [Keep a Changelog](https://keepachangelog.com/). Versioning follows SemVer (see CONTRIBUTING).

## Unreleased

### Added

-

## [0.40.0] - 2026-09-30

### Added

- Add Traverse and Search modes for breadth-first, depth-first, depth-limited, iterative-deepening, and multi-source graph traversal.
- Add search-only Bidirectional BFS with simultaneous start-side and target-side result reveals.
- Add seeded Random Walk with an optional seed, reproducible walks, reported seed metrics, and clear revisit animation without badges.
- Preserve explored search footprints in Result reveals, animate multi-source waves concurrently, and replay every IDDFS depth while keeping final metrics immutable.

### Fixed

- Clarify traversal Results with prominent endpoints, orange traversal footprints, green returned paths, real-edge Multi-source overlays, consistent reveal timing, and shorter IDDFS depth pauses.

## [0.39.0] - 2026-09-29

### Added

- Replace Pathfinder and the path-specific Analyze flow with one definition-driven Analyze laboratory.
- Add BFS traversal and Dijkstra shortest path results, semantic trace playback, generic inspectors, and reversible checkpoints.
- Add a temporary hybrid world glyph layer with bounded result reveal and a blocking Result/Trace panel.

### Fixed

- Align Analyze Result/Trace with the app chrome, animate result artifacts, center zoom-stable node rings, fit the camera around the panel, and simplify trace playback and inspectors.
- Make result replay wait for true user inactivity without moving the camera, reveal BFS edges in traversal order, and refine inspector empty states, hover, expansion motion, and trace sizing.
- Align the Analyze setup panel with Generate controls, add searchable node inputs, and show contextual Last result access in the manager header.
- Distinguish important result nodes with geometric Start/End glyphs, quicken result reveals, preserve expanded trace inspectors during playback, and clarify Play/Pause/Restart/Reset transport states.

### Removed

- Remove the Pathfinder toolbar entry, Travel experience, A* selection, path enumeration, stored-run comparison, and step annotations from the product UI.

## [0.38.1] - 2026-09-29

### Fixed

- Restore full edge opacity outside active dimming overlays while preserving transparent non-matches during Tags focus.

## [0.38.0] - 2026-09-27

### Added

- Real transparency for dimmed edges using split-bucket instanced meshes.

## [0.37.0] - 2026-09-26

### Added

- Remove Groups tool; Nodes Group button auto-tags Group-N with monotonic counter.

## [0.36.0] - 2026-09-26

### Added

- Nodes filter keyword pill: substring label search replacing exact-node chips, with tags-only suggestions.

## [0.35.1] - 2026-09-26

### Fixed

- Tighter manager header-to-content gaps across tools.
- Whole-card Tags row editor target (click + focus ring) with action buttons unmoved and overlap-free.

## [0.35.0] - 2026-09-26

### Added

- Illustrated empty states (icon, title, hint) for the Nodes, Edges, Tags, and Groups tools, with distinct filter-no-match views.

## [0.34.0] - 2026-09-26

### Added

- Clear edge selection when closing or switching away from the Edges tool.

## [0.33.1] - 2026-09-26

### Fixed

- Tags search moves to a full-width row below the Tags title.
- Tag rows no longer overlap their action buttons; the full non-action area still opens the editor.
- Nodes and Edges header rows share one height so the Filter fields align.
- Tag rename helper sits close under the input with a darker success green.

## [0.33.0] - 2026-09-26

### Added

- Clear node selection when closing or switching away from the Nodes tool.

## [0.32.0] - 2026-09-26

### Added

- Sort the Edges tool list by source and destination node labels.

## [0.31.1] - 2026-09-25

### Fixed

- Tags tool interactions and polish: tag syntax helper, full-row editor target, tag-specific editor header, and header search field.

## [0.31.0] - 2026-09-26

### Added

- Shared node/edge tag vocabulary with alphanumeric-hyphen validation (silent strip).
- Tags tool (replaces Filters): usage-sorted list, focus emphasize/dim, rename companion, cascade delete.
- Nodes list search Nodes|Tags optgroups; TagPicker shared suggestions and clearer empty copy.

## [0.30.0] - 2026-07-30

### Added

- Hardening pass SPEC-029..038: multi-select, groups UI, directed edge visuals, node drag/position, pin-aware layout, dual algo/run compare, step annotation playback, attachments UI, named save slots and palette find.

### Notes

- SemVer from sequential SPEC bumps in merge-to-develop order (start `0.21.1` to `0.30.0`).

## [0.21.1] - 2026-07-30

### Added

- Initial MVP: manager CRUD, Explore world, Directions, Analyze (BFS/Dijkstra/A*), pathfinder, undo/redo, persist, palette, filters/groups, minimap, templates, Docker static image.
- SPEC-001..028 executed and released.

### Notes

- SemVer from sequential SPEC bumps in merge-to-develop order (start `0.0.1` to `0.21.1`).
- Docker: `docker compose up --build -d` then open http://localhost:8080
