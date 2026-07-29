import { describe, expect, it } from 'vitest';
import { createEmptyOverlay, pathOverlay } from './overlays';

describe('overlays', () => {
	it('createEmptyOverlay is none with empty ids', () => {
		expect(createEmptyOverlay()).toEqual({
			kind: 'none',
			nodeIds: [],
			edgeIds: [],
			dimOthers: false
		});
	});

	it('pathOverlay highlights path and dims others', () => {
		const o = pathOverlay(['a', 'b'], ['e1']);
		expect(o).toEqual({
			kind: 'path',
			nodeIds: ['a', 'b'],
			edgeIds: ['e1'],
			dimOthers: true
		});
		o.nodeIds.push('c');
		expect(pathOverlay(['a', 'b'], ['e1']).nodeIds).toEqual(['a', 'b']);
	});
});
