import { describe, expect, it } from 'vitest';
import { tabTitleFromGraph } from './tab-title';

describe('tabTitleFromGraph', () => {
	it('uses the graph title', () => {
		expect(tabTitleFromGraph('Comet Trail')).toBe('Comet Trail');
	});

	it('falls back to Yggnet when the graph title is blank', () => {
		expect(tabTitleFromGraph('')).toBe('Yggnet');
		expect(tabTitleFromGraph('   ')).toBe('Yggnet');
	});
});
