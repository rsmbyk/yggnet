import { describe, expect, it } from 'vitest';
import {
	analysisResultSequence,
	analysisGlyphScale,
	primaryAnalysisRole,
	revealDuration,
	revealProgress
} from './analysis-decoration';

describe('analysis decoration policy', () => {
	it('uses deterministic role priority', () => {
		expect(primaryAnalysisRole(['rejected', 'settled', 'frontier'])).toBe('frontier');
		expect(primaryAnalysisRole(['current', 'result', 'inspecting'])).toBe('result');
	});

	it('keeps glyph scale stable at every camera distance', () => {
		expect(analysisGlyphScale(1)).toBe(1);
		expect(analysisGlyphScale(1000)).toBe(1);
		expect(analysisGlyphScale(20)).toBe(1);
	});

	it('bounds result reveal and supports immediate reduced motion', () => {
		expect(revealDuration(1)).toBe(800);
		expect(revealDuration(10_000)).toBe(3000);
		expect(revealProgress(revealDuration(10) / 2, 10, false)).toBeCloseTo(0.5);
		expect(revealProgress(0, 10, true)).toBe(1);
	});

	it('interleaves BFS tree edges with the nodes they discover', () => {
		expect(
			analysisResultSequence([
				{
					kind: 'ordered-nodes',
					id: 'traversal',
					label: 'Traversal order',
					nodeIds: ['A', 'B', 'C', 'D', 'E']
				},
				{
					kind: 'tree',
					id: 'tree',
					label: 'BFS tree',
					nodeIds: ['A', 'B', 'C', 'D', 'E'],
					edgeIds: ['A-B', 'A-C', 'A-D', 'B-E']
				}
			])
		).toEqual([
			{ kind: 'node', id: 'A' },
			{ kind: 'edge', id: 'A-B' },
			{ kind: 'node', id: 'B' },
			{ kind: 'edge', id: 'A-C' },
			{ kind: 'node', id: 'C' },
			{ kind: 'edge', id: 'A-D' },
			{ kind: 'node', id: 'D' },
			{ kind: 'edge', id: 'B-E' },
			{ kind: 'node', id: 'E' }
		]);
	});
});
