import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
	posixRel,
	readBump,
	patchSpecMeta,
	stripItemRows,
	setYamlField
} from './board-helpers.mjs';

function resolveSpecDir(id) {
	const padded = String(id).padStart(3, '0');
	const entries = fs.readdirSync('specs').filter((n) => n.startsWith(`${padded}-`));
	if (entries.length !== 1) {
		throw new Error(`Expected one specs/${padded}-* dir, found: ${entries.join(', ') || '(none)'}`);
	}
	return path.join('specs', entries[0]);
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

function main() {
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
		(item.match(/## Summary\r?\n\r?\n([\s\S]*?)\r?\n\r?\n/) || [])[1]
			?.replace(/\s+/g, ' ')
			.trim() || title;
	const pri = (item.match(/^priority: (.*)$/m) || [])[1] || 'P2';
	const eff = (item.match(/^effort: (.*)$/m) || [])[1] || 'M';
	const specDir = resolveSpecDir(id);
	const specRel = posixRel(specDir);
	const slug = path.basename(specDir);
	let specText = fs.readFileSync(path.join(specDir, 'spec.md'), 'utf8');
	const bump = readBump(specText);

	const status = action === 'done' ? 'done' : action === 'in_review' ? 'in_review' : 'in_progress';
	item = setYamlField(item, 'status', status);
	item = setYamlField(item, 'updated', date);
	if (branch) item = setYamlField(item, 'branch', branch);
	if (pr) item = setYamlField(item, 'pr', pr);
	fs.writeFileSync(itemPath, item);

	specText = patchSpecMeta(specText, status, date);
	fs.writeFileSync(path.join(specDir, 'spec.md'), specText);

	const order = ['Backlog', 'Speccing', 'Ready', 'In progress', 'In review', 'Done'];
	let board = fs.readFileSync('backlog/board.md', 'utf8');
	const { head, map } = parseSections(board);

	for (const name of order) {
		if (map.has(name)) map.set(name, stripItemRows(map.get(name), id));
	}

	const specCell = `[${slug}](../${specRel}/spec.md)`;

	if (action === 'in_progress') {
		const header =
			'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | Branch | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
		const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | ${specCell} | ${bump} | ${branch} | ${date} |`;
		const prev = (map.get('In progress') || header).trimEnd();
		const base = prev.includes('| ID') ? prev : header;
		map.set('In progress', `${base}\n${row}\n`);
	} else if (action === 'in_review') {
		const header =
			'| ID  | Title | Summary | Type | Priority | Effort | Spec | Bump | PR  | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | --- | ------- |';
		const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | ${specCell} | ${bump} | ${pr} | ${date} |`;
		const prev = (map.get('In review') || header).trimEnd();
		const base = prev.includes('| ID') ? prev : header;
		map.set('In review', `${base}\n${row}\n`);
	} else if (action === 'done') {
		const header =
			'| ID | Title | Summary | Type | Priority | Effort | Spec | Bump | Merged | Updated |\n| --- | ----- | ------- | ---- | -------- | ------ | ---- | ---- | ------ | ------- |';
		const row = `| [ITEM-${id}](items/ITEM-${id}.md) | ${title} | ${sum} | feat | ${pri} | ${eff} | ${specCell} | ${bump} | ${date} | ${date} |`;
		const prev = (map.get('Done') || header).trimEnd();
		const base = prev.includes('| ID') ? prev : header;
		map.set('Done', `${base}\n${row}\n`);
	}

	fs.writeFileSync('backlog/board.md', serialize(head, map, order));
	console.log(`Moved ITEM-${id} to ${action}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
