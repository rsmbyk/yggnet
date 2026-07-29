# Agent guide (Yggnet)

Pronunciation: **IG-net**.

## Before coding

1. Read `docs/vision.md`, relevant `docs/adr/*`, and the active `SPEC-XXX` pack.
2. Do **not** invent scope — follow SPEC acceptance criteria and tasks.
3. Wait for owner gates: **Ready**, **`execute SPEC-XXX`**, PR **OK**, **`release`**.

## Rules

- **TDD** for testable behavior; keep `src/lib/graph/**` ≥90% coverage.
- **Playwright** for user-visible flows touched by the SPEC.
- **Git Flow:** feature branches from `develop`; hotfixes from `main`.
- Update `backlog/board.md` + ITEM frontmatter in the same PR as status changes.
- Process-only work: one meaningful-unit PR; no version bump.
- Conventional Commits; agent commits end with `Co-authored-by: Cursor <cursoragent@cursor.com>`.
- Do not mention personal names in docs — use roles (“project owner”, “reviewer”).
- Never commit secrets. Never force-push protected branches unless explicitly requested.

## Architecture

- Domain: `src/lib/graph/**` (framework-agnostic).
- Thin `src/lib/session/**` for mode / open-doc / directions-analyze UI state.
- `src/lib/world/**` Threlte; `src/lib/ui/**` manager chrome.
- Monolith route: `/` is the app shell.
