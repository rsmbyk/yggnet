# ADR-008: Unified analysis laboratory

- **Status:** Accepted
- **Date:** 2026-09-29
- **Spec:** [SPEC-061](../../specs/061-unified-analyze/spec.md)

## Context

Pathfinder, Analyze, stored runs, and comparison each owned overlapping path-shaped state. Their contracts assumed every algorithm accepted two endpoints and returned one path, which made traversal algorithms and richer future results awkward.

## Decision

Yggnet has one Analyze tool. Framework-agnostic `AnalysisDefinition` values declare fields, validation, and execution over serializable snapshots. Executions return composable artifacts and immutable semantic events. A reducer reconstructs reversible frames with checkpoints every 100 events and retains at most 50,000 events without limiting result computation.

The session retains one analysis only. The right-side Result/Trace panel owns playback state and blocks graph editing while leaving camera controls available. The world renders semantic roles through a temporary, non-interactive glyph layer; algorithms never own meshes, colors, or animation timing. Algorithms may emit semantic landmark artifacts for important result nodes, while the shared renderer owns their badge geometry, labels, colors, and combined-role treatment.

BFS traversal and Dijkstra shortest path are the initial definitions. Pathfinder, Travel, A*, path enumeration, stored runs, comparison, and annotations are superseded.

## Consequences

- A typical new algorithm adds a definition and domain tests without adding a toolbar entry or custom panel.
- Results and explanatory traces remain separate views of the same execution.
- Structural graph changes invalidate the current analysis; presentation and position changes do not.
- Analysis state and glyphs are session-only and never enter graph persistence or undo history.
- Result landmarks remain serializable algorithm output and do not couple algorithm definitions to Three.js presentation details.
