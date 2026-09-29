# Plan 059: Delivery record remediation

- **Status:** Accepted
- **Spec:** [./spec.md](./spec.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Item:** ITEM-067
- **Bump:** none

## Why

Merged work through PR #34 has process-record drift: the board and ITEM records disagree for SPEC-057/058, their spec packs retain unfinished fields, and PR #34 lacks a traceable ITEM/spec. `AGENTS.md` also conflicts with the canonical vendor-attribution rule in `docs/PROCESS.md`.

## Scope / edges

**In:**

- Correct ITEM-065/066 and `backlog/board.md` to the evidence from merged PRs #32/#33
- Complete the existing SPEC-057/058 traceability and task records without changing their historical functional scope
- Add ITEM-067 and this spec pack as the formal backfill for PR #34's already-shipped Tags hover/focus behavior
- Replace the Cursor-specific attribution sentence in `AGENTS.md` with the PROCESS-compatible vendor-authorship policy

**Out:**

- Application, E2E, compose, dependency, CI, version, changelog, release, or tag changes
- Rewriting historical commit trailers or PR bodies
- Cutting `main` or releasing versions pending on `develop`

## Approach

1. Reconcile board/frontmatter against GitHub PR #32 and #33 records.
2. Record the existing implementation and validation evidence in SPEC-057/058; keep their spec status `Accepted`, per PROCESS's allowed SDD statuses after acceptance.
3. Backfill a factual spec and ITEM for PR #34, including the existing Playwright coverage, without claiming a new implementation.
4. Make `AGENTS.md` defer to the canonical, authoring-vendor-specific co-author rule in PROCESS.
5. Verify markdown/frontmatter links, the relevant repository search results, and the standard quality suite.

## Risks

- Historical evidence can be overstated. Mitigate by citing only PR numbers, merged commits, current test locations, and commands that are rerun in this remediation PR.
- The remediation could accidentally imply a fresh release. Mitigate with `bump: none` and unchanged version/changelog files.
