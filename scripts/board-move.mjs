import fs from 'fs';

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const id = process.argv[3];
const action = process.argv[4];
const branch = process.argv[5] || '';
const pr = process.argv[6] || '';

if (!id || !action) {
	console.error('Usage: board-move.mjs DATE ID done|in_progress|in_review [branch] [pr]');
	process.exit(1);
}

const itemPath = `backlog/items/ITEM-${id}.md`;
let item = fs.readFileSync(itemPath, 'utf8');
const title = (item.match(/^title: "(.*)"$/m) || [])[1] || `ITEM-${id}`;
const sum =
	(item.match(/## Summary\r?\n\r?\n([\s\S]*?)\r?\n\r?\n/) || [])[1]?.replace(/\s+/g, ' ').trim() ||
	title;
const pri = (item.match(/^priority: (.*)$/m) || [])[1] || 'P2';
const eff = (item.match(/^effort: (.*)$/m) || [])[1] || 'M';
const bump =
	(fs.readFileSync(`docs/specs/SPEC-${id}/spec.md`, 'utf8').match(/^bump: (.*)$/m) || [])[1] ||
	'minor';

const status =
	action === 'done' ? 'done' : action === 'in_review' ? 'in_review' : 'in_progress';
item = item.replace(/^status:.*$/m, `status: ${status}`);
item = item.replace(/^updated:.*$/m, `updated: ${date}`);
if (branch) item = item.replace(/^branch:.*$/m, `branch: ${branch}`);
if (pr) item = item.replace(/^pr:.*$/m, `pr: ${pr}`);
fs.writeFileSync(itemPath, item);

let spec = fs.readFileSync(`docs/specs/SPEC-${id}/spec.md`, 'utf8');
spec = spec.replace(/^status:.*$/m, `status: ${status}`);
spec = spec.replace(/^updated:.*$/m, `updated: ${date}`);
fs.writeFileSync(`docs/specs/SPEC-${id}/spec.md`, spec);

function stripItemRows(text) {
	return text
		.split('\n')
		.filter((line) => !line.includes(`ITEM-${id}`))
		.join('\n');
}

/** Split board into ## sections (last section included). */
function parseSections(board) {
	const parts = board.split(/\r?\n(?=## )/);
	const head = parts[0];
	/** @type {Map<string, string>} */
	const map = new Map();
	for (let i = 1; i < parts.length; i++) {
		const block = parts[i];
		const name = block.match(/^## ([^\r\n]+)/)?.[1];
		if (!name) continue;
		const body = block.replace(/^## [^\r\n]+\r?\n\r?\n?/, '');
		map.set(name, body);
	}
	return { head, map };
}

function serialize(head, map, order) {
	let out = head.trimEnd() + '\n\n';
	for (const name of order) {
		const body = (map.get(name) || '').trimEnd();
		out += `## ${name}\n\n${body}\n\n`;
	}
	return out.trimEnd() + '\n';
}

const order = ['Backlog', 'Speccing', 'Ready', 'In progress', 'In review', 'Done'];
let board = fs.readFileSync('backlog/board.md', 'utf8');
const { head, map } = parseSections(board);

for (const name of order) {
	if (map.has(name)) map.set(name, stripItemRows(map.get(name)));
}

if (action === 'in_progress') {
	const header =
		'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | [SPEC-${id}](../docs/specs/SPEC-${id}/spec.md) | ${bump} | ${branch} | ${date} |`;
	map.set('In progress', `${header}\n${row}\n`);
} else if (action === 'in_review') {
	const header =
		'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | [SPEC-${id}](../docs/specs/SPEC-${id}/spec.md) | ${bump} | ${pr} | ${date} |`;
	const prev = stripItemRows(map.get('In review') || header).trimEnd();
	const base = prev.includes('| ID') ? prev : header;
	map.set('In review', `${base}\n${row}\n`);
} else if (action === 'done') {
	const header =
		'| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | [SPEC-${id}](../docs/specs/SPEC-${id}/spec.md) | ${bump} | ${date} | ${date} |`;
	const prev = stripItemRows(map.get('Done') || header).trimEnd();
	const base = prev.includes('| ID') ? prev : header;
	map.set('Done', `${base}\n${row}\n`);
}

fs.writeFileSync('backlog/board.md', serialize(head, map, order));
console.log(`Moved ITEM-${id} to ${action}`);
