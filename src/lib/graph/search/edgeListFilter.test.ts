import { describe, expect, it } from 'vitest';
import { edgeMatchesListFilter } from './edgeListFilter';

const nodes = {
	a: { id: 'a', label: 'Alpha' },
	b: { id: 'b', label: 'Beta' },
	c: { id: 'c', label: 'Gamma' }
};

const edge = (partial: {
	id?: string;
	from?: string;
	to?: string;
	tags?: string[];
}) => ({
	id: partial.id ?? 'e1',
	from: partial.from ?? 'a',
	to: partial.to ?? 'b',
	tags: partial.tags ?? []
});

describe('edgeMatchesListFilter', () => {
	it('matches all when query and tags are empty', () => {
		expect(edgeMatchesListFilter(edge({}), nodes, '', [])).toBe(true);
		expect(edgeMatchesListFilter(edge({}), nodes, '   ', [])).toBe(true);
	});

	it('matches endpoint label substring', () => {
		expect(edgeMatchesListFilter(edge({}), nodes, 'alp', [])).toBe(true);
		expect(edgeMatchesListFilter(edge({}), nodes, 'bet', [])).toBe(true);
		expect(edgeMatchesListFilter(edge({}), nodes, 'xyz', [])).toBe(false);
	});

	it('matches endpoint or edge id prefix', () => {
		expect(edgeMatchesListFilter(edge({ id: 'edge-99' }), nodes, 'edge', [])).toBe(true);
		expect(edgeMatchesListFilter(edge({ from: 'a' }), nodes, 'a', [])).toBe(true);
	});

	it('matches any selected edge tag (OR)', () => {
		const e = edge({ tags: ['red', 'blue'] });
		expect(edgeMatchesListFilter(e, nodes, '', ['red'])).toBe(true);
		expect(edgeMatchesListFilter(e, nodes, '', ['green'])).toBe(false);
		expect(edgeMatchesListFilter(e, nodes, '', ['green', 'blue'])).toBe(true);
	});

	it('ORs text match with tag match', () => {
		const e = edge({ tags: ['bird'] });
		expect(edgeMatchesListFilter(e, nodes, 'alp', ['other'])).toBe(true);
		expect(edgeMatchesListFilter(e, nodes, 'xyz', ['bird'])).toBe(true);
		expect(edgeMatchesListFilter(e, nodes, 'xyz', ['other'])).toBe(false);
	});
});
