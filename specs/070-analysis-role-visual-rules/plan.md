# Plan 070: Analysis role visual rules

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-078
- **Bump:** patch

## Why

Temporary Analyze roles currently have ambiguous fallback colors that can collide with final result meaning.

## Approach

Centralize temporary and persistent semantic role rendering in the shared decoration policy. Default
Reveal actions resolve to settled orange; only explicit path emphasis uses green. Preserve component,
critical, and endpoint precedence without changing timing or algorithm contracts.
