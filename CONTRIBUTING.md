# Contributing to Yggnet

Locked process: [`docs/PROCESS.md`](./docs/PROCESS.md). Permission gate: [`docs/rules/SDD-GATE.md`](./docs/rules/SDD-GATE.md). Adopt/sync: [`docs/ADOPT.md`](./docs/ADOPT.md).

## Branching (Git Flow)

| Branch              | Role                          |
| ------------------- | ----------------------------- |
| `main`              | Production (Vercel prod)      |
| `develop`           | Integration / staging         |
| `feat/NNN-slug`     | Feature work (from `develop`) |
| `fix/NNN-slug`      | Fix (from `develop`)          |
| `hotfix/NNN-slug`   | Hotfix (from `main`)          |
| `docs/*`, `chore/*` | Process / chore branches      |

Default PR target for features: **`develop`**. Never create `cursor/` or other vendor-named branches.

## Specs & backlog

1. Capture ideas as `ITEM-XXX` on the [board](./backlog/board.md).
2. Draft `specs/NNN-slug/{plan,spec,tasks}.md` **before** code (SDD).
3. Owner **Accepts** the Draft → Ready.
4. Owner authorizes execute → implement with TDD on a feature branch.
5. Open a **draft** PR (Summary / Spec / Test plan). Board, tasks, and version bump (if any) land in **that same PR**.
6. Owner OK → merge to `develop`. When `bump` ≠ `none`, tag `vX.Y.Z` on `main` in the same session the owner cuts production (see PROCESS Git Flow notes).

Process-only changes: `bump: none`; no `VERSION` change.

## Testing

- **TDD** for behavior (red → green → refactor).
- **Coverage fence:** `src/lib/graph/**` ≥ **90%** (lines/branches/functions/statements).
- **Playwright** for UI flows from day one.
- UI outside `graph/`: behavior tests required; no hard 90% line bar.

```bash
npm run test:coverage
npm run test:e2e
```

## Versioning

- Canonical: repo-root [`VERSION`](./VERSION) (mirrored in `package.json`).
- ITEM/spec `bump` decides the SemVer step — **not** Conventional Commit type.
- When `bump` ≠ `none`: bump `VERSION` + changelog `## [X.Y.Z]` + ITEM `release_version` in **the same PR** as the work.
- When `bump` is `none`: leave `VERSION` unchanged; no tag.
- Git Flow: feature PR targets `develop` (already versioned). Tag on the `main` cut; merge back so `VERSION` matches.

## Architecture boundaries

- `src/lib/graph/**` must **not** import Svelte, `$app/*`, `three`, or `@threlte/*`.
- UI/world call the graph public API (`$lib/graph`).
- Algorithms run via `AlgorithmRunner` on serializable snapshots (worker-ready).
- See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md).

## Deploy (Vercel)

- On Vercel, `VERCEL=1` selects `@sveltejs/adapter-vercel`.
- Local Windows builds use `@sveltejs/adapter-static` (avoids symlink EPERM from adapter-vercel).
- Do not set a custom Output Directory in the Vercel project UI (leave default/blank).
