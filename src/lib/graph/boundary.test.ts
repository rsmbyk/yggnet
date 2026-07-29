import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const GRAPH_ROOT = join(process.cwd(), 'src/lib/graph');
const FORBIDDEN = [
	/from\s+['"]svelte/,
	/from\s+['"]\$app\//,
	/from\s+['"]three/,
	/from\s+['"]@threlte\//,
	/import\s*\(\s*['"]svelte/,
	/import\s*\(\s*['"]three/,
	/import\s*\(\s*['"]@threlte\//
];

function walk(dir: string): string[] {
	const out: string[] = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...walk(p));
		else if (/\.(ts|js)$/.test(name) && !/\.test\.(ts|js)$/.test(name)) out.push(p);
	}
	return out;
}

describe('graph import boundary', () => {
	it('does not import Svelte, SvelteKit, Three, or Threlte', () => {
		const files = walk(GRAPH_ROOT);
		expect(files.length).toBeGreaterThan(0);
		const violations: string[] = [];
		for (const file of files) {
			const src = readFileSync(file, 'utf8');
			for (const re of FORBIDDEN) {
				if (re.test(src)) {
					violations.push(`${relative(process.cwd(), file)} matches ${re}`);
				}
			}
		}
		expect(violations).toEqual([]);
	});
});
