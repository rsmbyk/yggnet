# Architecture — Yggnet

Product architecture is recorded in ADRs and supporting docs (not reinvented here).

| Doc | Topic |
| --- | --- |
| [`adr/001-stack.md`](./adr/001-stack.md) | SvelteKit, Threlte, custom graph core, Vercel |
| [`adr/002-git-flow-vercel.md`](./adr/002-git-flow-vercel.md) | Git Flow + hosting |
| [`adr/003-trace-first-algorithms.md`](./adr/003-trace-first-algorithms.md) | Trace-first algorithms |
| [`adr/004-graph-boundary.md`](./adr/004-graph-boundary.md) | Framework-agnostic `src/lib/graph/**` |
| [`adr/005-semver-release.md`](./adr/005-semver-release.md) | SemVer (superseded by 007) |
| [`adr/006-algorithm-runner.md`](./adr/006-algorithm-runner.md) | AlgorithmRunner |
| [`adr/007-adopt-vexbook.md`](./adr/007-adopt-vexbook.md) | Adopt vexbook process `v0.4.0` |
| [`world-scale.md`](./world-scale.md) | World / camera numeric defaults |
| [`vision.md`](./vision.md) | Product locks |

## Version identity

- Canonical: repo-root [`VERSION`](../VERSION)
- Mirror: `package.json` `"version"` (keep equal to `VERSION`)
- History: [`CHANGELOG.md`](../CHANGELOG.md)
- Tags: `vX.Y.Z` on `main` when the owner cuts production (Git Flow)

## Layout (app)

- Domain: `src/lib/graph/**` (framework-agnostic)
- Thin `src/lib/session/**` for mode / open-doc / directions-analyze UI state
- `src/lib/world/**` Threlte; `src/lib/ui/**` manager chrome
- World/camera defaults: `src/lib/world/world-config.ts`
- Monolith route: `/` is the app shell

Process: [`PROCESS.md`](./PROCESS.md).
