# Spec: Delivery record remediation

- **ID:** 059
- **Status:** Accepted
- **Item:** ITEM-067
- **Plan:** [./plan.md](./plan.md)
- **Tasks:** [./tasks.md](./tasks.md)
- **Bump:** none

## Intent

Bring process records for the merged SPEC-057, SPEC-058, and PR #34 work into agreement with the repository's SDD and Git Flow rules, without changing product behavior.

## Scope

### In scope

- Move ITEM-065 to Done in the board and retain its PR #32/release metadata
- Add PR #33 to ITEM-066 and retain its Done/release metadata
- Complete traceability and task checklists for SPEC-057 and SPEC-058; their status remains `Accepted`
- Add ITEM-067 and document PR #34's Tags row hover/focus behavior, related E2E coverage, and PR evidence
- Make `AGENTS.md` require the co-author trailer of the vendor product that authored a commit, matching `docs/PROCESS.md`

### Out of scope

- Changes to `src/`, `e2e/`, `compose.yml`, CI, dependencies, versions, changelog, releases, tags, or existing commit/PR text
- Retrospective alteration of the merged PR #34 diff

## Acceptance scenarios

### Scenario: Historical records agree

- **Given** PR #32 and PR #33 are merged into `develop`
- **When** their ITEM files and board rows are inspected
- **Then** ITEM-065 and ITEM-066 are Done and identify their actual PRs, specs, bumps, and release version without contradictory board status

### Scenario: Completed spec packs remain valid SDD records

- **Given** SPEC-057 and SPEC-058 were accepted and merged
- **When** their packs are reviewed
- **Then** the spec status is one of the allowed SDD values, checklists reflect completed work, and traceability names the implementation, validation, and merged PR evidence

### Scenario: PR #34 is traceable

- **Given** the merged Tags hover/focus changes in PR #34
- **When** the backlog and SPEC-059 records are reviewed
- **Then** ITEM-067 links the PR and SPEC-059 documents the existing behavior and its `e2e/tags-tool.e2e.ts` coverage without adding a new product change

### Scenario: Attribution rule has one source of truth

- **Given** an agent prepares a commit
- **When** it reads `AGENTS.md`
- **Then** it is directed to use the co-author trailer for the vendor product that authored the commit, consistent with `docs/PROCESS.md`, rather than a Cursor-only trailer

## Traceability

- Historical evidence: PR #32, PR #33, and PR #34
- Planned validation: `npm run lint`, `npm run check`, `npm run test:coverage`, `npm run build`, `npm run test:e2e`
