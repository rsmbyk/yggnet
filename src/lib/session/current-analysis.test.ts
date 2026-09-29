import { describe, expect, it } from 'vitest';
import type { AnalysisOutput } from '$lib/graph';
import {
	closeAnalysis,
	createCurrentAnalysis,
	invalidateAnalysis,
	openAnalysisTrace,
	seekAnalysis,
	setAnalysisSpeed
} from './current-analysis';

const output: AnalysisOutput = {
	result: { outcome: 'complete', summary: 'Done', metrics: [], artifacts: [] },
	events: [
		{
			sequence: 0,
			action: 'start',
			narration: { key: 'start', refs: {} },
			roles: [],
			inspectors: []
		},
		{ sequence: 1, action: 'done', narration: { key: 'done', refs: {} }, roles: [], inspectors: [] }
	]
};

describe('current analysis lifecycle', () => {
	it('opens in result mode and replaces the prior analysis', () => {
		const first = createCurrentAnalysis('bfs', { start: 'A' }, output, 1);
		const second = createCurrentAnalysis('dijkstra', { start: 'A', end: 'B' }, output, 2);
		expect(first.panel).toBe('result');
		expect(second.algorithmId).toBe('dijkstra');
		expect(second.sourceRevision).toBe(2);
	});

	it('closes without discarding and resumes in result or trace mode', () => {
		const current = createCurrentAnalysis('bfs', { start: 'A' }, output, 1);
		expect(closeAnalysis(current)?.panel).toBe('closed');
		expect(openAnalysisTrace(closeAnalysis(current)!)?.panel).toBe('trace');
	});

	it('clamps seeking and supports the specified speeds', () => {
		let current = openAnalysisTrace(createCurrentAnalysis('bfs', { start: 'A' }, output, 1))!;
		current = seekAnalysis(current, 99)!;
		expect(current.cursor).toBe(1);
		expect(setAnalysisSpeed(current, 2)?.speed).toBe(2);
		expect(setAnalysisSpeed(current, 3)?.speed).toBe(1);
	});

	it('clears immediately when structurally invalidated', () => {
		const current = createCurrentAnalysis('bfs', { start: 'A' }, output, 1);
		expect(invalidateAnalysis(current)).toBeNull();
	});
});
