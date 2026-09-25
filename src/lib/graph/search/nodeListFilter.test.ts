import { describe, expect, it } from 'vitest';
import { nodeMatchesListFilter } from './nodeListFilter';

const node = (partial: { id?: string; tags?: string[] }) => ({
	id: partial.id ?? 'n1',
	tags: partial.tags ?? []
});

describe('nodeMatchesListFilter', () => {
	it('matches all when nodeIds and tags are empty', () => {
		expect(nodeMatchesListFilter(node({}), [], [])).toBe(true);
	});

	it('matches selected node ids', () => {
		expect(nodeMatchesListFilter(node({ id: 'a' }), ['a'], [])).toBe(true);
		expect(nodeMatchesListFilter(node({ id: 'a' }), ['b'], [])).toBe(false);
	});

	it('matches any selected tag (OR)', () => {
		const n = node({ tags: ['red', 'blue'] });
		expect(nodeMatchesListFilter(n, [], ['red'])).toBe(true);
		expect(nodeMatchesListFilter(n, [], ['green'])).toBe(false);
		expect(nodeMatchesListFilter(n, [], ['green', 'blue'])).toBe(true);
	});

	it('ORs node id match with tag match', () => {
		const n = node({ id: 'n1', tags: ['bird'] });
		expect(nodeMatchesListFilter(n, ['n1'], ['other'])).toBe(true);
		expect(nodeMatchesListFilter(n, ['other'], ['bird'])).toBe(true);
		expect(nodeMatchesListFilter(n, ['other'], ['other'])).toBe(false);
	});
});
