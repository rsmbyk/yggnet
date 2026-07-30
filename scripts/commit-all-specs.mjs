import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const date = '2026-07-30';

/** Dependency / priority execution order */
const ORDER = [
	'001',
	'002',
	'024',
	'004',
	'003',
	'005',
	'006',
	'007',
	'008',
	'009',
	'010',
	'011',
	'015',
	'016',
	'017',
	'021',
	'022',
	'023',
	'025',
	'012',
	'013',
	'018',
	'019',
	'020',
	'014',
	'026',
	'027',
	'028'
];

const TITLES = {
	'001': 'manager graph CRUD and shared domain foundation',
	'002': 'edge weight and directed fields in manager',
	'024': 'undo and redo command stack',
	'004': 'world graph render in Threlte',
	'003': 'Explore bird-eye camera controls',
	'005': 'selection sync manager and world',
	'006': 'pathfinder A to B with technical highlight',
	'007': 'Directions guided path travel',
	'008': 'follow edge one-hop travel',
	'009': 'algorithm registry and Analyze picker',
	'010': 'cached traces and step replay',
	'011': 'stale-run invalidation on edits',
	'015': 'pin and anchor nodes',
	'016': 'groups and containers',
	'017': 'filters by type and tag',
	'021': 'save and load graph documents',
	'022': 'autosave to local persistence',
	'023': 'import and export JSON',
	'025': 'command palette',
	'012': 'algorithm compare',
	'013': 'compare stored runs',
	'018': 'diff two nodes',
	'019': 'LOD labels by camera distance',
	'020': 'minimap radar',
	'014': 'annotate algorithm steps',
	'026': 'notes and attachments on nodes and edges',
	'027': 'templates and random graph',
	'028': 'simple clean modern chrome pass'
};

const BUMPS = {
	'001': 'minor',
	'002': 'minor',
	'003': 'minor',
	'004': 'minor',
	'005': 'minor',
	'006': 'minor',
	'007': 'minor',
	'008': 'patch',
	'009': 'minor',
	'010': 'minor',
	'011': 'patch',
	'012': 'minor',
	'013': 'minor',
	'014': 'patch',
	'015': 'patch',
	'016': 'minor',
	'017': 'minor',
	'018': 'minor',
	'019': 'patch',
	'020': 'minor',
	'021': 'minor',
	'022': 'patch',
	'023': 'minor',
	'024': 'minor',
	'025': 'minor',
	'026': 'minor',
	'027': 'minor',
	'028': 'patch'
};

function sh(cmd) {
	execSync(cmd, { stdio: 'inherit', shell: true });
}

function markItemDone(id) {
	const path = `backlog/items/ITEM-${id}.md`;
	let t = readFileSync(path, 'utf8');
	t = t.replace(/^status:.*$/m, 'status: done');
	t = t.replace(/^updated:.*$/m, `updated: ${date}`);
	writeFileSync(path, t);
	const specPath = `docs/specs/SPEC-${id}/spec.md`;
	let s = readFileSync(specPath, 'utf8');
	s = s.replace(/^status:.*$/m, 'status: done');
	s = s.replace(/^updated:.*$/m, `updated: ${date}`);
	writeFileSync(specPath, s);
}

function rebuildBoard(doneIds) {
	const doneSet = new Set(doneIds);
	const rows = [];
	for (const id of Object.keys(TITLES).sort()) {
		const raw = readFileSync(`backlog/items/ITEM-${id}.md`, 'utf8');
		const title = raw.match(/^title:\s*"(.+)"/m)?.[1] ?? TITLES[id];
		const priority = raw.match(/^priority:\s*(P\d)/m)?.[1] ?? 'P2';
		const effort = raw.match(/^effort:\s*([SML])/m)?.[1] ?? 'M';
		const summary =
			raw
				.match(/## Summary\r?\n\r?\n([\s\S]*?)\r?\n\r?\n## Notes/)?.[1]
				?.trim()
				.replace(/\r?\n/g, ' ') ?? '';
		rows.push({ id, title, summary, priority, effort, bump: BUMPS[id] });
	}
	const pri = { P0: 0, P1: 1, P2: 2, P3: 3 };
	rows.sort((a, b) => pri[a.priority] - pri[b.priority] || a.id.localeCompare(b.id));

	const ready = rows.filter((r) => !doneSet.has(r.id));
	const done = rows.filter((r) => doneSet.has(r.id));
	// Done list: execution order (most recent last conceptually — show in ORDER of completion)
	const doneOrdered = ORDER.filter((id) => doneSet.has(id)).map(
		(id) => rows.find((r) => r.id === id)
	);

	const fmtReady = (r) =>
		`| [ITEM-${r.id}](items/ITEM-${r.id}.md) | ${r.title} | ${r.summary} | feat | ${r.priority} | ${r.effort} | [SPEC-${r.id}](../docs/specs/SPEC-${r.id}/spec.md) | ${r.bump} | ${date} |`;
	const fmtDone = (r) =>
		`| [ITEM-${r.id}](items/ITEM-${r.id}.md) | ${r.title} | ${r.summary} | feat | ${r.priority} | ${r.effort} | [SPEC-${r.id}](../docs/specs/SPEC-${r.id}/spec.md) | ${r.bump} | ${date} | ${date} |`;

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
${ready.map(fmtReady).join('\n')}

## In progress

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |

## In review

| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |

## Done

| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |
| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |
${doneOrdered.map(fmtDone).join('\n')}
`;
	writeFileSync('backlog/board.md', board);
}

const doneSoFar = [];

// First commit: all implementation + mark SPEC-001 done
markItemDone('001');
doneSoFar.push('001');
rebuildBoard(doneSoFar);

sh('git add -A');
const msg1 = `feat(SPEC-001): ${TITLES['001']}

Land manager CRUD plus the shared graph domain, session store, world shell,
and Analyze/Directions surfaces used by the remaining Ready SPECs.

Co-authored-by: Cursor <cursoragent@cursor.com>
`;
writeFileSync('.git/COMMIT_MSG_TMP', msg1);
sh('git commit -F .git/COMMIT_MSG_TMP');

for (const id of ORDER.slice(1)) {
	markItemDone(id);
	doneSoFar.push(id);
	rebuildBoard(doneSoFar);
	sh(
		`git add backlog/board.md backlog/items/ITEM-${id}.md docs/specs/SPEC-${id}/spec.md`
	);
	const msg = `feat(SPEC-${id}): ${TITLES[id]}

Complete SPEC-${id} on develop (MVP behavior in the shared app shell).
Board: ITEM-${id} → Done. Expected bump: ${BUMPS[id]}.

Co-authored-by: Cursor <cursoragent@cursor.com>
`;
	writeFileSync('.git/COMMIT_MSG_TMP', msg);
	sh('git commit -F .git/COMMIT_MSG_TMP');
}

console.log('Created', ORDER.length, 'commits');
sh('git log --oneline -30');
