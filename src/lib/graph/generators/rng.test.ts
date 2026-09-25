import { describe, expect, it } from 'vitest';
import { createRng } from './rng';

describe('createRng edge cases', () => {
	it('int returns min when max < min', () => {
		const rng = createRng(1);
		expect(rng.int(5, 2)).toBe(5);
	});

	it('pick falls back when the indexed slot is missing', () => {
		const rng = createRng(1);
		expect(rng.pick(['only'])).toBe('only');
		// empty list: index is always 0 / undefined → ?? items[0]
		expect(rng.pick([] as string[])).toBeUndefined();
	});

	it('shuffle leaves empty and singleton arrays unchanged', () => {
		const rng = createRng(1);
		expect(rng.shuffle([])).toEqual([]);
		expect(rng.shuffle(['a'])).toEqual(['a']);
	});
});
