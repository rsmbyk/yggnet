import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
	posixRel,
	readBump,
	patchSpecMeta,
	stripItemRows,
	setYamlField
} from './board-helpers.mjs';

describe('board-helpers', () => {
	it('posixRel normalizes separators', () => {
		expect(posixRel(path.join('specs', '001-manager-graph-crud'))).toBe(
			'specs/001-manager-graph-crud'
		);
	});

	it('readBump prefers YAML and ignores template pipes', () => {
		expect(readBump('bump: patch\n')).toBe('patch');
		expect(readBump('- **Bump:** minor\n')).toBe('minor');
		expect(readBump('- **Bump:** major | minor | patch | none\n')).toBe('minor');
		expect(readBump('')).toBe('minor');
	});

	it('patchSpecMeta maps markdown Status to Accepted', () => {
		const md = `# Spec\n\n- **Status:** Draft\n- **Bump:** minor\n`;
		expect(patchSpecMeta(md, 'in_progress', '2026-09-25')).toContain('- **Status:** Accepted');
		expect(patchSpecMeta(md, 'done', '2026-09-25')).not.toContain('done');

		const yaml = `---\nstatus: ready\nupdated: 2026-01-01\n---\n`;
		const patched = patchSpecMeta(yaml, 'done', '2026-09-25');
		expect(patched).toContain('status: done');
		expect(patched).toContain('updated: 2026-09-25');
	});

	it('stripItemRows only drops the matching ID cell', () => {
		const board = [
			'| ID | Title | Summary |',
			'| --- | --- | --- |',
			'| [ITEM-040](items/ITEM-040.md) | Canonical | see ITEM-039 note |',
			'| [ITEM-039](items/ITEM-039.md) | World shell | related ITEM-040 |',
			'| ITEM-041 | Camera | bare |'
		].join('\n');

		const stripped = stripItemRows(board, '040');
		expect(stripped).not.toContain('ITEM-040.md');
		expect(stripped).toContain('ITEM-039.md');
		expect(stripped).toContain('related ITEM-040');
		expect(stripped).toContain('ITEM-041');
	});

	it('setYamlField replaces or appends missing keys', () => {
		const withKey = `---\nstatus: backlog\n---\n\n# Hi\n`;
		expect(setYamlField(withKey, 'status', 'done')).toContain('status: done');

		const missing = `---\nid: ITEM-001\nstatus: backlog\n---\n\n# Hi\n`;
		const added = setYamlField(missing, 'branch', 'feat/001-x');
		expect(added).toMatch(/^branch: feat\/001-x$/m);
		expect(added).toContain('status: backlog');
	});
});
