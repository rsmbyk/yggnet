import { describe, expect, it } from 'vitest';
import { edgeMatchesListFilter } from './edgeListFilter';

const edge = (partial: { from?: string; to?: string; tags?: string[] }) => ({
	from: partial.from ?? 'a',
	to: partial.to ?? 'b',
	tags: partial.tags ?? []
});

describe('edgeMatchesListFilter', () => {
	it('matches all when nodeIds and tags are empty', () => {
		expect(edgeMatchesListFilter(edge({}), [], [])).toBe(true);
	});

	it('matches edges incident to any selected node (exact id)', () => {
		expect(edgeMatchesListFilter(edge({ from: 'a', to: 'b' }), ['a'], [])).toBe(true);
		expect(edgeMatchesListFilter(edge({ from: 'a', to: 'b' }), ['b'], [])).toBe(true);
		expect(edgeMatchesListFilter(edge({ from: 'a', to: 'b' }), ['c'], [])).toBe(false);
		expect(edgeMatchesListFilter(edge({ from: 'a', to: 'b' }), ['c', 'b'], [])).toBe(true);
	});

	it('matches any selected edge tag (OR)', () => {
		const e = edge({ tags: ['red', 'blue'] });
		expect(edgeMatchesListFilter(e, [], ['red'])).toBe(true);
		expect(edgeMatchesListFilter(e, [], ['green'])).toBe(false);
		expect(edgeMatchesListFilter(e, [], ['green', 'blue'])).toBe(true);
	});

	it('ORs node match with tag match', () => {
		const e = edge({ from: 'a', to: 'b', tags: ['bird'] });
		expect(edgeMatchesListFilter(e, ['a'], ['other'])).toBe(true);
		expect(edgeMatchesListFilter(e, ['c'], ['bird'])).toBe(true);
		expect(edgeMatchesListFilter(e, ['c'], ['other'])).toBe(false);
	});
});
