import { describe, expect, it } from 'vitest';
import { compareOverlay, createEmptyOverlay, pathOverlay, pathSeriesMetrics } from './overlays';

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

	it('compareOverlay keeps distinguishable series with union ids', () => {
		const o = compareOverlay(
			{ nodeIds: ['a', 'b'], edgeIds: ['e1'] },
			{ nodeIds: ['b', 'c'], edgeIds: ['e2'] }
		);
		expect(o.kind).toBe('compare');
		expect(o.dimOthers).toBe(true);
		expect(o.nodeIds).toEqual(['a', 'b', 'c']);
		expect(o.edgeIds).toEqual(['e1', 'e2']);
		expect(o.seriesA).toEqual({ nodeIds: ['a', 'b'], edgeIds: ['e1'] });
		expect(o.seriesB).toEqual({ nodeIds: ['b', 'c'], edgeIds: ['e2'] });
		o.seriesA?.nodeIds.push('z');
		expect(compareOverlay({ nodeIds: ['a'], edgeIds: [] }, { nodeIds: ['c'], edgeIds: [] }).seriesA)
			.toEqual({ nodeIds: ['a'], edgeIds: [] });
	});

	it('pathSeriesMetrics sums hops and edge weights', () => {
		expect(pathSeriesMetrics(['e1', 'e2'], { e1: 2, e2: 3 })).toEqual({ hops: 2, cost: 5 });
		expect(pathSeriesMetrics([], {})).toEqual({ hops: 0, cost: 0 });
	});
});
