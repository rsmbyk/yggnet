# ADR-002: Git Flow and Vercel environments

## Status

Accepted

## Context

Need clear staging vs production and a Done column for unreleased work on develop.

## Decision

- **Git Flow:** `main` (prod), `develop` (staging), feature/hotfix/release branches
- **Vercel:** `develop` → staging; `main` → production; PR previews for review
- **No GitHub Actions for now** (billing); tests run locally and may run in Vercel build

## Consequences

More merge discipline; Done = on develop awaiting release; archive after prod release (or cancel).
