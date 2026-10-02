# ADR-002: Git Flow and Vercel environments

## Status

Accepted (amended: GitHub Actions CI)

## Context

Need clear staging vs production and a Done column for unreleased work on develop.
Earlier we skipped GitHub Actions for billing; merge quality still needs a shared gate.

## Decision

- **Git Flow:** `main` (prod), `develop` (staging), feature/hotfix/release branches
- **Vercel:** `develop` → staging; `main` → production; PR previews for review
- **GitHub Actions CI** on pushes and pull requests to `develop` and `main`: lint, typecheck, graph unit coverage (≥90%), build, and Playwright e2e (Chromium). Vercel remains the deploy path for staging/production.

## Consequences

More merge discipline; Done = on develop awaiting release; archive after prod release (or cancel).
Supersedes the prior “no GitHub Actions” note — CI minutes are accepted for the gate above; keep the workflow single-job and Chromium-only to limit cost.
