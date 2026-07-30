import fs from 'fs';

const date = process.argv[2] || new Date().toISOString().slice(0, 10);
const id = process.argv[3];
const action = process.argv[4]; // done | in_progress | in_review
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

item = item.replace(/^status:.*$/m, `status: ${action === 'done' ? 'done' : action === 'in_review' ? 'in_review' : 'in_progress'}`);
item = item.replace(/^updated:.*$/m, `updated: ${date}`);
if (branch) {
	item = item.replace(/^branch:.*$/m, `branch: ${branch}`);
}
if (pr) {
	item = item.replace(/^pr:.*$/m, `pr: ${pr}`);
}
fs.writeFileSync(itemPath, item);

let spec = fs.readFileSync(`docs/specs/SPEC-${id}/spec.md`, 'utf8');
spec = spec.replace(
	/^status:.*$/m,
	`status: ${action === 'done' ? 'done' : action === 'in_review' ? 'in_review' : 'in_progress'}`
);
spec = spec.replace(/^updated:.*$/m, `updated: ${date}`);
fs.writeFileSync(`docs/specs/SPEC-${id}/spec.md`, spec);

function stripRow(sectionBody, itemId) {
	return sectionBody
		.split('\n')
		.filter((line) => !line.includes(`ITEM-${itemId}`))
		.join('\n');
}

let board = fs.readFileSync('backlog/board.md', 'utf8');

function replaceSection(name, nextBody) {
	const re = new RegExp(`## ${name}\\r?\\n\\r?\\n([\\s\\S]*?)(?=\\r?\\n## )`);
	board = board.replace(re, `## ${name}\n\n${nextBody.trimEnd()}\n\n`);
}

function getSection(name) {
	const m = board.match(new RegExp(`## ${name}\\r?\\n\\r?\\n([\\s\\S]*?)(?=\\r?\\n## )`));
	return m ? m[1] : '';
}

for (const col of ['Ready', 'In progress', 'In review', 'Done', 'Speccing', 'Backlog']) {
	const body = getSection(col);
	if (!body) continue;
	replaceSection(col, stripRow(body, id));
}

if (action === 'in_progress') {
	const header =
		'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | [SPEC-${id}](../docs/specs/SPEC-${id}/spec.md) | ${bump} | ${branch} | ${date} |`;
	replaceSection('In progress', `${header}\n${row}`);
} else if (action === 'in_review') {
	const header =
		'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | [SPEC-${id}](../docs/specs/SPEC-${id}/spec.md) | ${bump} | ${pr} | ${date} |`;
	const prev = getSection('In review').trim();
	const hasHeader = prev.includes('| ID');
	replaceSection(
		'In review',
		hasHeader && prev.split('\n').length > 2 ? `${stripRow(prev, id).trimEnd()}\n${row}` : `${header}\n${row}`
	);
} else if (action === 'done') {
	const header =
		'| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | [SPEC-${id}](../docs/specs/SPEC-${id}/spec.md) | ${bump} | ${date} | ${date} |`;
	const prev = getSection('Done').trim();
	const lines = prev.split('\n').filter(Boolean);
	const base = lines.length >= 2 ? stripRow(prev, id).trimEnd() : header;
	replaceSection('Done', `${base}\n${row}`);
}

fs.writeFileSync('backlog/board.md', board);
console.log(`Moved ITEM-${id} to ${action}`);
