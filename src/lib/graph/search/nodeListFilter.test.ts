import { describe, expect, it } from 'vitest';
import { nodeMatchesListFilter } from './nodeListFilter';

const node = (partial: { id?: string; label?: string; tags?: string[] }) => ({
	id: partial.id ?? 'n1',
	label: partial.label ?? 'Node 1',
	tags: partial.tags ?? []
});

describe('nodeMatchesListFilter', () => {
	it('matches all when tags and keyword are empty', () => {
		expect(nodeMatchesListFilter(node({}), [], '')).toBe(true);
	});

	it('matches any selected tag (OR)', () => {
		const n = node({ tags: ['red', 'blue'] });
		expect(nodeMatchesListFilter(n, ['red'], '')).toBe(true);
		expect(nodeMatchesListFilter(n, ['green'], '')).toBe(false);
		expect(nodeMatchesListFilter(n, ['green', 'blue'], '')).toBe(true);
	});

	it('matches label substring case-insensitively', () => {
		const n = node({ label: 'Alpha Centauri' });
		expect(nodeMatchesListFilter(n, [], 'alp')).toBe(true);
		expect(nodeMatchesListFilter(n, [], 'CENTAURI')).toBe(true);
		expect(nodeMatchesListFilter(n, [], 'pha cen')).toBe(true);
		expect(nodeMatchesListFilter(n, [], 'zzz')).toBe(false);
	});

	it('ANDs keyword with tags', () => {
		const n = node({ label: 'Alpha', tags: ['red'] });
		expect(nodeMatchesListFilter(n, ['red'], 'alp')).toBe(true);
		expect(nodeMatchesListFilter(n, ['red'], 'zzz')).toBe(false);
		expect(nodeMatchesListFilter(n, ['green'], 'alp')).toBe(false);
		expect(nodeMatchesListFilter(n, [], 'alp')).toBe(true);
	});
});
