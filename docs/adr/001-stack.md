# ADR-001: Stack — SvelteKit, Threlte, custom graph core

## Status

Accepted

## Context

Yggnet needs a dual UI (manager + 3D bird’s-eye world), heavy client interaction, and a testable domain for graphs/algorithms.

## Decision

- **SvelteKit** app shell (monolith `/`)
- **Threlte** + Three.js for the world
- **Custom** TypeScript graph core under `src/lib/graph/**` (no graphology for now)
- **Plain CSS + CSS variables** (no Tailwind / UI kit)
- **Vercel** hosting (static SPA adapter; `develop` staging / `main` prod) · **MIT** license

## Consequences

Fast web iteration; domain testable without mounting WebGL; Threlte ecosystem smaller than R3F but adequate.
