# Changelog

All notable changes to Yggnet will be documented here.

Format inspired by [Keep a Changelog](https://keepachangelog.com/). Versioning follows SemVer (see CONTRIBUTING).

## Unreleased

### Added

-

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
