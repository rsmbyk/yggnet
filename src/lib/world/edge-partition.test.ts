import { describe, expect, it } from 'vitest';
import { partitionEdgesByDimming } from './edge-partition';

const edges = [{ id: 'edge-a' }, { id: 'edge-b' }, { id: 'edge-c' }];

describe('partitionEdgesByDimming', () => {
	it('keeps every edge opaque when dimming is inactive', () => {
		expect(partitionEdgesByDimming(edges, new Set(), false)).toEqual({
			opaque: edges,
			dimmed: []
		});
	});

	it('dims only non-matching edges when dimming is active', () => {
		expect(partitionEdgesByDimming(edges, new Set(['edge-b']), true)).toEqual({
			opaque: [edges[1]],
			dimmed: [edges[0], edges[2]]
		});
	});

	it('restores every edge to opaque after dimming is cleared', () => {
		const focused = partitionEdgesByDimming(edges, new Set(['edge-b']), true);
		expect(focused.dimmed).toHaveLength(2);

		expect(partitionEdgesByDimming(edges, new Set(['edge-b']), false)).toEqual({
			opaque: edges,
			dimmed: []
		});
	});
});
