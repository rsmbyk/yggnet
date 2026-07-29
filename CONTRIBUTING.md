# Contributing to Yggnet

## Branching (Git Flow)

| Branch                 | Role                          |
| ---------------------- | ----------------------------- |
| `main`                 | Production (Vercel prod)      |
| `develop`              | Integration / staging         |
| `feat/SPEC-XXX-slug`   | Feature work (from `develop`) |
| `hotfix/SPEC-XXX-slug` | Hotfix (from `main`)          |
| `release/X.Y.Z`        | Release cut                   |

Default PR target for features: **`develop`**.

## Specs & backlog

1. Capture ideas as `ITEM-XXX` on the [board](./backlog/board.md).
2. Authorized owner asks to **spec** → write `docs/specs/SPEC-XXX/{spec,plan,tasks}.md`.
3. Owner marks **Ready**.
4. Owner says **`execute SPEC-XXX`** → implement with TDD.
5. PR → **In review**; owner OK → merge.
6. Owner **`release`** → version + `main` + archive.

Process changes (items/specs/Ready): one PR per meaningful unit. **No SemVer bump** on process merges.

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

- No bump on merge to `develop`.
- On **release:** apply each included SPEC’s `bump` (`major` \| `minor` \| `patch` \| `none`) in **merge-to-`develop` order**.
- Hotfixes bump from current `main` via a (tiny) SPEC.

## Architecture boundaries

- `src/lib/graph/**` must **not** import Svelte, `$app/*`, `three`, or `@threlte/*`.
- UI/world call the graph public API (`$lib/graph`).
- Algorithms run via `AlgorithmRunner` on serializable snapshots (worker-ready).

## Code style

`npm run format` · `npm run lint` · `npm run check`
