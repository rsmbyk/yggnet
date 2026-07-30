import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const date = '2026-07-30';

/** @type {Record<string, { area: string; bump: string; problem: string; goals: string[]; nong: string[]; mode: string; domain: string; algo: string; persist: string; risks: string[]; related: string }>} */
const meta = {
	'001': {
		area: 'manager',
		bump: 'minor',
		problem: 'Users cannot yet build or edit graph structure from the outer manager.',
		goals: [
			'CRUD nodes and edges in the manager',
			'Support disconnected components in one document',
			'Keep world in sync with document mutations'
		],
		nong: ['In-world create UI', 'Import/export (ITEM-023)', 'Undo stack (ITEM-024)'],
		mode: 'Manager + Explore (document shared)',
		domain: 'GraphDocument nodes/edges maps; ops to add/update/remove.',
		algo: 'N/A',
		persist: 'In-memory session document only unless other SPECs landed.',
		risks: ['Large graphs may need virtualized lists later'],
		related: 'SPEC-002, SPEC-004, SPEC-005, SPEC-024'
	},
	'002': {
		area: 'manager',
		bump: 'minor',
		problem:
			'Edges lack first-class direction and weight required for many algorithms and org/roadmap semantics.',
		goals: ['Store directed + weight on edges', 'Edit both in manager', 'Feed weighted/directed algos'],
		nong: ['UI for algorithm picker (ITEM-009)', 'Pathfinding itself (ITEM-006)'],
		mode: 'Manager',
		domain: 'GraphEdge.directed, GraphEdge.weight; defaults documented.',
		algo: 'Enables Dijkstra/A* later',
		persist: 'Included in document schema',
		risks: ['Migration if older docs lack fields — use defaults'],
		related: 'SPEC-001, SPEC-006, SPEC-009'
	},
	'003': {
		area: 'explore',
		bump: 'minor',
		problem: "World camera is a static placeholder; Explore needs RTS/SimCity bird's-eye navigation.",
		goals: ['Pan, zoom, light orbit', 'Overview vs street altitude', "Keep bird's-eye (not FPS)"],
		nong: ['Directions travel (ITEM-007)', 'Minimap (ITEM-020)'],
		mode: 'Explore',
		domain: 'Session mode explore; camera state in session/world only',
		algo: 'N/A',
		persist: 'Optional camera bookmark later — out of scope',
		risks: ['Orbit too free becomes FPS-like — clamp tilt'],
		related: 'SPEC-004, SPEC-007, SPEC-019, SPEC-020'
	},
	'004': {
		area: 'world',
		bump: 'minor',
		problem: 'GraphDocument is not rendered as nodes/edges in the Threlte world.',
		goals: ['Render nodes and edges from document', 'Technical visual language', 'Update on document change'],
		nong: ['Path highlight overlays (ITEM-006)', 'LOD labels (ITEM-019)', 'Live floating motion (parked)'],
		mode: 'Explore world',
		domain: 'Read GraphDocument positions/labels',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Perf for large graphs — start simple'],
		related: 'SPEC-001, SPEC-003, SPEC-005, SPEC-006'
	},
	'005': {
		area: 'world',
		bump: 'minor',
		problem: 'Manager and world selection can diverge without shared domain API usage.',
		goals: ['Single selection source in graph/', 'Bidirectional sync', 'Clear selection'],
		nong: ['Multi-select (later)', 'Edge selection unless cheap'],
		mode: 'Manager + Explore',
		domain: 'selection.ts APIs',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Re-render loops — careful subscriptions'],
		related: 'SPEC-001, SPEC-004, SPEC-025'
	},
	'006': {
		area: 'directions',
		bump: 'minor',
		problem: 'No A→B pathfinding UX: all paths, shortest ties, select, technical highlight.',
		goals: [
			'List all simple paths (capped)',
			'Shortest mode with all ties',
			'Select path + technical overlay'
		],
		nong: ['Guided travel (ITEM-007)', 'Full algo picker (ITEM-009) — may use BFS initially'],
		mode: 'Directions + manager path panel',
		domain: 'Path results + overlays',
		algo: 'At least BFS unweighted; respect directed when set',
		persist: 'N/A',
		risks: ['Path explosion — enforce max results/depth'],
		related: 'SPEC-002, SPEC-007, SPEC-009, SPEC-010'
	},
	'007': {
		area: 'directions',
		bump: 'minor',
		problem: 'Selected paths cannot be traveled Google-Directions style.',
		goals: ['Guided camera along selected path', 'Compact route UI', 'Exit to Explore'],
		nong: ['Algorithm step replay (ITEM-010)', 'Follow-edge only hop (ITEM-008)'],
		mode: 'Directions',
		domain: 'session.directions selectedPathId',
		algo: 'Uses path from SPEC-006',
		persist: 'N/A',
		risks: ['Motion — keep speed sane; reduce-motion later'],
		related: 'SPEC-003, SPEC-006, SPEC-008'
	},
	'008': {
		area: 'directions',
		bump: 'patch',
		problem: 'No one-hop follow along a single edge.',
		goals: ['From selected node follow chosen edge to neighbor', 'Same travel language as Directions'],
		nong: ['Full A→B pathfinder'],
		mode: 'Explore/Directions',
		domain: 'Edge id + endpoints',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['None major'],
		related: 'SPEC-005, SPEC-007'
	},
	'009': {
		area: 'analyze',
		bump: 'minor',
		problem: 'No pluggable algorithm registry or extensive shortest-path picker.',
		goals: ['Algorithm registry with needs metadata', 'Picker UI in Analyze', 'Run via AlgorithmRunner'],
		nong: [
			'Worker thread impl (later)',
			'Every algorithm on day one — ship registry + BFS/Dijkstra/A* minimum'
		],
		mode: 'Analyze',
		domain: 'algorithms registry',
		algo: 'BFS, Dijkstra, A* minimum; extensible',
		persist: 'N/A',
		risks: ['Scope creep on algorithm count'],
		related: 'SPEC-006, SPEC-010, SPEC-012'
	},
	'010': {
		area: 'analyze',
		bump: 'minor',
		problem: 'Runs do not cache traces for step replay without recompute.',
		goals: ['Result-first UX', 'Cache trace on Run', 'Playback/scrub Show steps'],
		nong: ['Annotate steps (ITEM-014)'],
		mode: 'Analyze',
		domain: 'runs + TraceEvent[]',
		algo: 'All registered algos emit traces',
		persist: 'Runs in session/memory initially',
		risks: ['Huge traces — cap events'],
		related: 'SPEC-009, SPEC-011, SPEC-014'
	},
	'011': {
		area: 'analyze',
		bump: 'patch',
		problem: 'Edits can leave algorithm results looking current when they are not.',
		goals: ['Mark runs stale on graph mutation', 'Clear UI stale state', 'Re-run refreshes'],
		nong: ['Auto-rerun'],
		mode: 'Analyze + Manager edits',
		domain: 'Run.stale flag',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Which mutations count — define set'],
		related: 'SPEC-010, SPEC-001, SPEC-024'
	},
	'012': {
		area: 'analyze',
		bump: 'minor',
		problem: 'Cannot compare two algorithms on the same inputs.',
		goals: ['Select two algorithms same A/B or action', 'Show both results', 'Hook to compare-runs'],
		nong: ['Full dual overlay chrome (ITEM-013)'],
		mode: 'Analyze',
		domain: 'two Run records',
		algo: 'Uses registry',
		persist: 'N/A',
		risks: ['UI clutter'],
		related: 'SPEC-009, SPEC-013'
	},
	'013': {
		area: 'analyze',
		bump: 'minor',
		problem: 'Stored runs cannot be compared visually side-by-side.',
		goals: ['Pick two runs', 'Dual overlay or split result panels', 'Keep chrome calm'],
		nong: ['Multi-run >2'],
		mode: 'Analyze',
		domain: 'runs store',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Visual noise — default one hero overlay'],
		related: 'SPEC-010, SPEC-012'
	},
	'014': {
		area: 'analyze',
		bump: 'patch',
		problem: 'Cannot annotate individual trace steps for teaching/notes.',
		goals: ['Add note on step', 'Persist with run', 'Visible in replay'],
		nong: ['Rich attachments on steps'],
		mode: 'Analyze playback',
		domain: 'step annotations map',
		algo: 'N/A',
		persist: 'With run record',
		risks: ['Schema growth'],
		related: 'SPEC-010'
	},
	'015': {
		area: 'world',
		bump: 'patch',
		problem: 'Nodes cannot be pinned against layout movement.',
		goals: ['Pin/unpin', 'Pinned positions stable'],
		nong: ['Full layout engine'],
		mode: 'Manager + Explore',
		domain: 'GraphNode.pinned',
		algo: 'N/A',
		persist: 'In document',
		risks: ['None'],
		related: 'SPEC-001, SPEC-004'
	},
	'016': {
		area: 'world',
		bump: 'minor',
		problem: 'No collapse/expand for subgraph districts.',
		goals: ['Group nodes', 'Collapse to district', 'Expand in place'],
		nong: ['Deep nested groups v2'],
		mode: 'Manager + Explore',
		domain: 'groupId / group entities',
		algo: 'N/A',
		persist: 'In document',
		risks: ['Edge routing when collapsed'],
		related: 'SPEC-004, SPEC-017'
	},
	'017': {
		area: 'manager',
		bump: 'minor',
		problem: 'Cannot filter the visible graph by type/tag/status.',
		goals: ['Filter controls', 'Hide/dim filtered-out', 'Sync manager and world'],
		nong: ['Saved filter presets'],
		mode: 'Manager + Explore',
		domain: 'tags/types on nodes',
		algo: 'N/A',
		persist: 'Filter state in session',
		risks: ['Empty view — show empty state'],
		related: 'SPEC-004, SPEC-016, SPEC-025'
	},
	'018': {
		area: 'manager',
		bump: 'minor',
		problem: 'No side-by-side node diff with optional path between them.',
		goals: ['Diff two nodes meta', 'Optional path highlight'],
		nong: ['Three-way diff'],
		mode: 'Manager + Directions overlay',
		domain: 'selection of two ids',
		algo: 'May call pathfinder',
		persist: 'N/A',
		risks: ['Depends on SPEC-006 for path'],
		related: 'SPEC-005, SPEC-006'
	},
	'019': {
		area: 'world',
		bump: 'patch',
		problem: 'Labels are not LOD-aware for overview vs street.',
		goals: ['Hide/minimize labels at overview', 'Show at street zoom'],
		nong: ['Full typographic system'],
		mode: 'Explore',
		domain: 'N/A camera distance',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Flicker at threshold — hysteresis'],
		related: 'SPEC-003, SPEC-004'
	},
	'020': {
		area: 'world',
		bump: 'minor',
		problem: 'No minimap radar for orientation in large graphs.',
		goals: ['Minimap extent + viewport', 'Click/drag to pan'],
		nong: ['Minimap editing'],
		mode: 'Explore',
		domain: 'N/A',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Perf — simplify geometry'],
		related: 'SPEC-003, SPEC-004'
	},
	'021': {
		area: 'persist',
		bump: 'minor',
		problem: 'No explicit save/load of graph documents.',
		goals: ['Save document', 'Load into session'],
		nong: ['Cloud sync', 'Autosave (ITEM-022)'],
		mode: 'Manager',
		domain: 'GraphDocument serialize',
		algo: 'N/A',
		persist: 'File or named local slot',
		risks: ['Overwrite confirmations'],
		related: 'SPEC-022, SPEC-023'
	},
	'022': {
		area: 'persist',
		bump: 'patch',
		problem: 'Refresh loses in-progress graph.',
		goals: ['Debounced autosave', 'Restore on load'],
		nong: ['Multi-document autosave slots UI'],
		mode: 'App session',
		domain: 'serialize document',
		algo: 'N/A',
		persist: 'localStorage/IndexedDB',
		risks: ['Quota limits'],
		related: 'SPEC-021'
	},
	'023': {
		area: 'persist',
		bump: 'minor',
		problem: 'No portable JSON import/export.',
		goals: ['Export JSON', 'Import valid JSON', 'Clear errors on invalid'],
		nong: ['CSV'],
		mode: 'Manager',
		domain: 'schemaVersion validation',
		algo: 'N/A',
		persist: 'Files',
		risks: ['Untrusted JSON — size limits'],
		related: 'SPEC-021'
	},
	'024': {
		area: 'manager',
		bump: 'minor',
		problem: 'Graph edits are not undoable.',
		goals: ['Undo/redo command stack', 'Works for manager mutations'],
		nong: ['Undo camera moves'],
		mode: 'Manager',
		domain: 'history/ commands',
		algo: 'N/A',
		persist: 'Memory stack',
		risks: ['Stack vs load — clear on load'],
		related: 'SPEC-001, SPEC-011'
	},
	'025': {
		area: 'meta',
		bump: 'minor',
		problem: 'Power actions are hard to reach without hunting panels.',
		goals: ['Shortcut opens palette', 'Find nodes', 'Invoke key actions'],
		nong: ['Full vim mode'],
		mode: 'Global',
		domain: 'uses selection + session',
		algo: 'Can trigger analyze',
		persist: 'N/A',
		risks: ['Shortcut conflicts'],
		related: 'SPEC-005, SPEC-006, SPEC-009'
	},
	'026': {
		area: 'manager',
		bump: 'minor',
		problem: 'Nodes/edges cannot carry notes and attachments.',
		goals: ['Notes on nodes and edges', 'Attachment refs', 'Show for selection'],
		nong: ['Full file hosting backend'],
		mode: 'Manager',
		domain: 'notes + attachments arrays',
		algo: 'N/A',
		persist: 'In document; blob refs local later',
		risks: ['Large attachments — limit size'],
		related: 'SPEC-001, SPEC-018'
	},
	'027': {
		area: 'persist',
		bump: 'minor',
		problem: 'Empty-world problem; no templates or random generator.',
		goals: ['Templates: blank/org/roadmap/learning', 'Random graph generator'],
		nong: ['Marketplace of templates'],
		mode: 'Manager / new graph flow',
		domain: 'seed documents',
		algo: 'Random graph gen',
		persist: 'New document',
		risks: ['Random may be huge — clamp sizes'],
		related: 'SPEC-001, SPEC-021'
	},
	'028': {
		area: 'meta',
		bump: 'patch',
		problem: 'Chrome may grow noisy without a deliberate simple/clean/modern pass.',
		goals: ['Minimal default chrome', 'Progressive disclosure', 'Panels do not overpower world'],
		nong: ['New visual brand illustration'],
		mode: 'All modes',
		domain: 'N/A',
		algo: 'N/A',
		persist: 'N/A',
		risks: ['Subjective — use checklist AC'],
		related: 'SPEC-001, SPEC-007, SPEC-009'
	}
};

const boardRows = [];

for (const id of Object.keys(meta).sort()) {
	const itemPath = join('backlog/items', `ITEM-${id}.md`);
	const raw = readFileSync(itemPath, 'utf8');
	const titleMatch = raw.match(/^title:\s*"(.+)"/m);
	const title = titleMatch?.[1] ?? 'Untitled';
	const priorityMatch = raw.match(/^priority:\s*(P\d)/m);
	const effortMatch = raw.match(/^effort:\s*([SML])/m);
	const priority = priorityMatch?.[1] ?? 'P2';
	const effort = effortMatch?.[1] ?? 'M';
	const summaryMatch = raw.match(/## Summary\r?\n\r?\n([\s\S]*?)\r?\n\r?\n## Notes/);
	const summary = (summaryMatch?.[1] ?? '').trim().replace(/\r?\n/g, ' ');

	const acSection = raw.split('## Acceptance sketch')[1]?.split('## Links')[0] ?? '';
	const acs = [...acSection.matchAll(/^- (.+)$/gm)].map((m) => m[1]);
	const m = meta[id];
	const specId = `SPEC-${id}`;
	const dir = join('docs/specs', specId);
	mkdirSync(dir, { recursive: true });

	const acMd = (acs.length ? acs : ['Meet ITEM acceptance sketch'])
		.map((a) => `- [ ] ${a}`)
		.join('\n');
	const goals = m.goals.map((g) => `- ${g}`).join('\n');
	const nong = m.nong.map((g) => `- ${g}`).join('\n');
	const risks = m.risks.map((r) => `- ${r}`).join('\n');

	const spec = `---
id: ${specId}
item: ITEM-${id}
type: feat
feature_area: ${m.area}
bump: ${m.bump}
status: ready
title: "${title}"
created: ${date}
updated: ${date}
---

# ${specId}: ${title}

## Problem

${m.problem}

## Goals

${goals}

## Non-goals

${nong}

## Users & context

Mode focus: **${m.mode}**.
UI/UX: simple, clean, modern; quiet chrome; technical world visuals where applicable.

## Behavior & UX

Implements ITEM-${id}. Progressive disclosure; manager for structure; world for presence.

### Acceptance criteria

${acMd}

## Data / domain

${m.domain}

## Algorithms / traces (if any)

${m.algo}

## Persistence / import-export (if any)

${m.persist}

## Test strategy

### Unit / domain (\`src/lib/graph/**\`)

- TDD for all domain changes; keep coverage fence ≥90% on \`src/lib/graph/**\`.

### Component / UI behavior

- Behavior tests for manager/controls introduced by this SPEC.

### Playwright (E2E)

- Smoke the primary user-visible flow for this SPEC.

## Risks & open questions

${risks}

## References

- Item: ITEM-${id}
- Related SPECs: ${m.related}
`;

	const plan = `# ${specId} — Plan

## Approach

Deliver ITEM-${id} (${title}) end-to-end: domain first (TDD), then session/UI/world adapters, then Playwright.

## Architecture touchpoints

- \`src/lib/graph/**\` — domain
- \`src/lib/session/**\` — mode / UI state if needed
- \`src/lib/ui/**\` — manager chrome
- \`src/lib/world/**\` — Threlte
- Feature area: **${m.area}**

## File / area checklist

- graph domain modules for this feature
- UI and/or world wiring
- e2e coverage

## TDD sequence

1. Red: domain tests from acceptance criteria
2. Green: implement domain
3. Wire UI/world
4. Playwright path

## Playwright plan

- Cover the main happy path described in acceptance criteria for ITEM-${id}.

## Migration / compatibility

- Preserve \`schemaVersion\` compatibility; default new fields when reading older documents if applicable.

## Rollout

- Branch: \`feat/${specId}-short-slug\`
- PR target: \`develop\`
- Expected bump: **${m.bump}**

## Risks & mitigations

${risks}
`;

	const tasks = `# ${specId} — Tasks

## Tasks

- [ ] **T1** — Domain types/ops + failing unit tests
  - Red: failing tests for ITEM-${id} acceptance
  - Green: domain API sketched
  - Notes: \`src/lib/graph\`

- [ ] **T2** — Implement domain behavior to green
  - Red: remaining failing domain tests
  - Green: all domain tests pass; coverage fence held
  - Notes: \`src/lib/graph\`

- [ ] **T3** — Wire UI / session / world as needed
  - Red: component or integration behavior tests
  - Green: manager/world reflect domain
  - Notes: \`src/lib/ui\`, \`session\`, \`world\`

- [ ] **T4** — Playwright: critical user path for ${title}
  - Red: e2e fails before feature
  - Green: e2e passes
  - Notes: \`e2e/\`

## Done when

- [ ] All acceptance criteria in spec.md checked
- [ ] \`src/lib/graph/**\` coverage bar still met (if this SPEC touches core)
- [ ] Playwright paths for this SPEC green
- [ ] Board / ITEM status updated for PR
`;

	writeFileSync(join(dir, 'spec.md'), spec);
	writeFileSync(join(dir, 'plan.md'), plan);
	writeFileSync(join(dir, 'tasks.md'), tasks);

	let item = raw;
	item = item.replace(/^status: backlog/m, 'status: ready');
	item = item.replace(/^status: ready/m, 'status: ready');
	item = item.replace(/^updated: .+$/m, `updated: ${date}`);
	if (/^spec:\s*$/m.test(item)) {
		item = item.replace(/^spec:\s*$/m, `spec: ${specId}`);
	} else if (/^spec:/m.test(item)) {
		item = item.replace(/^spec:.*$/m, `spec: ${specId}`);
	}
	item = item.replace(
		/^- Spec:.*$/m,
		`- Spec: [${specId}](../../docs/specs/${specId}/spec.md)`
	);
	writeFileSync(itemPath, item);

	boardRows.push({
		id,
		specId,
		title,
		summary,
		priority,
		effort,
		bump: m.bump
	});
}

const priOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
boardRows.sort((a, b) => priOrder[a.priority] - priOrder[b.priority] || a.id.localeCompare(b.id));

const table = boardRows
	.map(
		(r) =>
			`| [ITEM-${r.id}](items/ITEM-${r.id}.md) | ${r.title} | ${r.summary} | feat | ${r.priority} | ${r.effort} | [SPEC-${r.id}](../docs/specs/SPEC-${r.id}/spec.md) | ${r.bump} | ${date} |`
	)
	.join('\n');

const board = `# Backlog board

In-repo Kanban. Each card is an \`ITEM-XXX\`. Details live in the item (and SPEC) files.
Status moves follow project process (DoR → Ready → execute → PR review → Done → archive on release or drop).

**Approvals:** only an authorized project owner/reviewer promotes to Ready, authorizes \`execute SPEC-XXX\`, approves merge PRs, and calls \`release\`.

**Archive:** [\`archives.md\`](./archives.md) (not a column). Done = on \`develop\`, not yet in a production release.

### Column meanings

| Column      | Meaning                                          |
| ----------- | ------------------------------------------------ |
| Backlog     | Captured — no complete SPEC yet                  |
| Speccing    | SPEC pack in progress                            |
| Ready       | DoR met + owner OK — may execute                 |
| In progress | Execution started — feature/hotfix branch        |
| In review   | PR open — awaiting approval                      |
| Done        | Merged to \`develop\`, awaiting production release |

### Field guide

| Field    | Meaning                                                                           |
| -------- | --------------------------------------------------------------------------------- |
| Type     | Shared enum: \`feat\`, \`fix\`, \`hotfix\`, \`chore\`, \`docs\`, \`refactor\`, \`test\`, \`idea\` |
| Priority | \`P0\` highest … \`P3\` lowest                                                        |
| Effort   | \`S\` / \`M\` / \`L\`                                                                   |
| Bump     | Expected SemVer bump for the SPEC: \`major\` / \`minor\` / \`patch\` / \`none\`           |

---

## Backlog

| ID  | Title | Summary | Type | Priority | Effort | Spec | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ------- |

## Speccing

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |

## Ready

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------- |
${table}

## In progress

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |

## In review

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |

## Done

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |
`;

writeFileSync('backlog/board.md', board);
console.log(`Wrote ${boardRows.length} SPECs and moved items to Ready`);
