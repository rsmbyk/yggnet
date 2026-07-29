# ADR-004: Framework-agnostic graph domain

## Status

Accepted

## Context

Need ≥90% coverage and clear boundaries for a huge UI-heavy project.

## Decision

- `src/lib/graph/**` imports **no** Svelte, `$app/*`, `three`, or `@threlte/*`
- Enforced by boundary unit test
- Public API via `$lib/graph` (`index.ts`)
- Selection/session-of-selection lives in graph; shell mode in thin `session/`

## Consequences

UI and world are adapters; domain stays portable and worker-friendly.
