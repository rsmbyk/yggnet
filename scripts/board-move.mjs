import fs from 'fs';
import path from 'path';

function resolveSpecDir(id) {
	const padded = String(id).padStart(3, '0');
	const entries = fs.readdirSync('specs').filter((n) => n.startsWith(`${padded}-`));
	if (entries.length !== 1) {
		throw new Error(`Expected one specs/${padded}-* dir, found: ${entries.join(', ') || '(none)'}`);
	}
	return path.join('specs', entries[0]);
}

/** Repo-relative path with forward slashes (safe for markdown links on Windows). */
function posixRel(p) {
	return p.split(path.sep).join('/');
}

/**
 * Read bump from YAML frontmatter (`bump:`) or vexbook markdown header (`- **Bump:**`).
 * @param {string} text
 */
function readBump(text) {
	return (
		text.match(/^bump:\s*(.+)$/m)?.[1]?.trim() ||
		text.match(/^- \*\*Bump:\*\*\s*(.+)$/m)?.[1]?.trim()?.split(/\s*\|\s*/)[0] ||
		'minor'
	);
}

/**
 * Update status/updated in either YAML frontmatter or markdown header fields.
 * @param {string} text
 * @param {string} status
 * @param {string} date
 */
function patchSpecMeta(text, status, date) {
	let out = text;
	if (/^status:/m.test(out)) {
		out = out.replace(/^status:.*$/m, `status: ${status}`);
	} else if (/^- \*\*Status:\*\*/m.test(out)) {
		out = out.replace(/^- \*\*Status:\*\*.*$/m, `- **Status:** ${status}`);
	}
	if (/^updated:/m.test(out)) {
		out = out.replace(/^updated:.*$/m, `updated: ${date}`);
	} else if (/^- \*\*Updated:\*\*/m.test(out)) {
		out = out.replace(/^- \*\*Updated:\*\*.*$/m, `- **Updated:** ${date}`);
	}
	return out;
}

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
const title =
	(item.match(/^title:\s*['"](.*)['"]\s*$/m) || [])[1] ||
	(item.match(/^title:\s*(.+)$/m) || [])[1] ||
	`ITEM-${id}`;
const sum =
	(item.match(/## Summary\r?\n\r?\n([\s\S]*?)\r?\n\r?\n/) || [])[1]?.replace(/\s+/g, ' ').trim() ||
	title;
const pri = (item.match(/^priority: (.*)$/m) || [])[1] || 'P2';
const eff = (item.match(/^effort: (.*)$/m) || [])[1] || 'M';
const specDir = resolveSpecDir(id);
const specRel = posixRel(specDir);
const slug = path.basename(specDir);
let specText = fs.readFileSync(path.join(specDir, 'spec.md'), 'utf8');
const bump = readBump(specText);

const status = action === 'done' ? 'done' : action === 'in_review' ? 'in_review' : 'in_progress';
item = item.replace(/^status:.*$/m, `status: ${status}`);
item = item.replace(/^updated:.*$/m, `updated: ${date}`);
if (branch) item = item.replace(/^branch:.*$/m, `branch: ${branch}`);
if (pr) item = item.replace(/^pr:.*$/m, `pr: ${pr}`);
fs.writeFileSync(itemPath, item);

specText = patchSpecMeta(specText, status, date);
fs.writeFileSync(path.join(specDir, 'spec.md'), specText);

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

const specCell = `[${slug}](../${specRel}/spec.md)`;

if (action === 'in_progress') {
	const header =
		'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | ${specCell} | ${bump} | ${branch} | ${date} |`;
	map.set('In progress', `${header}\n${row}\n`);
} else if (action === 'in_review') {
	const header =
		'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | ${specCell} | ${bump} | ${pr} | ${date} |`;
	const prev = stripItemRows(map.get('In review') || header).trimEnd();
	const base = prev.includes('| ID') ? prev : header;
	map.set('In review', `${base}\n${row}\n`);
} else if (action === 'done') {
	const header =
		'| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
	const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | ${specCell} | ${bump} | ${date} | ${date} |`;
	const prev = stripItemRows(map.get('Done') || header).trimEnd();
	const base = prev.includes('| ID') ? prev : header;
	map.set('Done', `${base}\n${row}\n`);
}

fs.writeFileSync('backlog/board.md', serialize(head, map, order));
console.log(`Moved ITEM-${id} to ${action}`);
