# Agent guide (Yggnet)

Pronunciation: **IG-net**.

This product repo follows the **vexbook** process (adopted at `v0.4.0` — see [`docs/adr/007-adopt-vexbook.md`](docs/adr/007-adopt-vexbook.md)).

## Kickoff and adopt

- Greenfield spawn from the GitHub template: [`docs/KICKOFF.md`](docs/KICKOFF.md) only.
- Existing-repo adopt or keep-up sync: [`docs/ADOPT.md`](docs/ADOPT.md). **Owner-triggered only** — never sync unprompted.

## Before any change

1. Read [`docs/PROCESS.md`](docs/PROCESS.md) and every **must-apply shared doc** listed there (today: [`docs/rules/SDD-GATE.md`](docs/rules/SDD-GATE.md)).
2. Read product context: [`docs/vision.md`](docs/vision.md) / [`docs/PRODUCT.md`](docs/PRODUCT.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md), relevant `docs/adr/*`, and the active `specs/NNN-slug/` pack.
3. Plan (manual notes or any AI plan mode) **stops at Draft specs**.
4. Do **not** implement until the project owner Accepts that Draft. If Accept is unclear, **ask again**.
5. Do **not** invent scope — follow acceptance criteria and tasks.

## Vendor project rules (first session)

If this agent’s project-rules directory is missing or incomplete, create or update minimal local rules that **reference every** must-apply shared doc from PROCESS. When PROCESS adds a must-apply entry, update those rules the same way. This repo **commits** `.cursor/rules/` (owner/agent need).

## Yggnet product constraints

- **TDD** for testable behavior; keep `src/lib/graph/**` ≥90% coverage.
- **Playwright** for user-visible flows touched by the spec.
- **Git Flow:** feature branches from `develop` (`feat/NNN-slug`, …); hotfixes from `main`. Default PR target: `develop`.
- Update `backlog/board.md` + ITEM frontmatter in the **same PR** as status changes (one PR is complete — see PROCESS).
- Process-only work: `bump: none`; no `VERSION` change.
- Conventional Commits; agent commits end with `Co-authored-by: Cursor <cursoragent@cursor.com>`.
- Do not mention personal names in docs — use roles (“project owner”, “reviewer”).
- Never commit secrets. Never force-push protected branches unless the owner explicitly asks.
- Never create `cursor/`, vendor-named, or other non-standard agent branches.

## Architecture (app)

- Domain: `src/lib/graph/**` (framework-agnostic).
- Thin `src/lib/session/**` for mode / open-doc / directions-analyze UI state.
- `src/lib/world/**` Threlte; `src/lib/ui/**` manager chrome.
- World/camera numeric defaults: `src/lib/world/world-config.ts` — see `docs/world-scale.md`.
- Monolith route: `/` is the app shell.
- SemVer: repo-root `VERSION` is canonical; keep `package.json` `"version"` in sync.
