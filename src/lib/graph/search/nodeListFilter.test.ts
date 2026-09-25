import { describe, expect, it } from 'vitest';
import { nodeMatchesListFilter } from './nodeListFilter';

const node = (partial: { id?: string; label?: string; tags?: string[] }) => ({
	id: partial.id ?? 'n1',
	label: partial.label ?? 'Alpha',
	tags: partial.tags ?? []
});

describe('nodeMatchesListFilter', () => {
	it('matches all when query and tags are empty', () => {
		expect(nodeMatchesListFilter(node({}), '', [])).toBe(true);
		expect(nodeMatchesListFilter(node({}), '   ', [])).toBe(true);
	});

	it('matches label substring case-insensitively', () => {
		expect(nodeMatchesListFilter(node({ label: 'Falcon' }), 'fal', [])).toBe(true);
		expect(nodeMatchesListFilter(node({ label: 'Falcon' }), 'xyz', [])).toBe(false);
	});

	it('matches id prefix', () => {
		expect(nodeMatchesListFilter(node({ id: 'abcd-1234' }), 'abcd', [])).toBe(true);
		expect(nodeMatchesListFilter(node({ id: 'abcd-1234' }), '1234', [])).toBe(false);
	});

	it('matches any selected tag (OR)', () => {
		const n = node({ tags: ['red', 'blue'] });
		expect(nodeMatchesListFilter(n, '', ['red'])).toBe(true);
		expect(nodeMatchesListFilter(n, '', ['green'])).toBe(false);
		expect(nodeMatchesListFilter(n, '', ['green', 'blue'])).toBe(true);
	});

	it('ORs text match with tag match', () => {
		const n = node({ label: 'Falcon', tags: ['bird'] });
		expect(nodeMatchesListFilter(n, 'fal', ['other'])).toBe(true);
		expect(nodeMatchesListFilter(n, 'xyz', ['bird'])).toBe(true);
		expect(nodeMatchesListFilter(n, 'xyz', ['other'])).toBe(false);
	});
});
