import { describe, expect, it } from 'vitest';
import type { AnalysisOutput } from '$lib/graph';
import {
	ANALYSIS_PLAYBACK_INTERVAL_MS,
	closeAnalysis,
	createCurrentAnalysis,
	invalidateAnalysis,
	openAnalysisTrace,
	resetAnalysis,
	seekAnalysis,
	stepAnalysis
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
		expect(ANALYSIS_PLAYBACK_INTERVAL_MS).toBe(300);
	});

	it('closes without discarding and resumes in result or trace mode', () => {
		const current = createCurrentAnalysis('bfs', { start: 'A' }, output, 1);
		expect(closeAnalysis(current)?.panel).toBe('closed');
		expect(openAnalysisTrace(closeAnalysis(current)!)?.panel).toBe('trace');
	});

	it('clamps seeking', () => {
		let current = openAnalysisTrace(createCurrentAnalysis('bfs', { start: 'A' }, output, 1))!;
		current = seekAnalysis(current, 99)!;
		expect(current.cursor).toBe(1);
	});

	it('pauses when stepping or resetting playback', () => {
		let current = openAnalysisTrace(createCurrentAnalysis('bfs', { start: 'A' }, output, 1))!;
		current = { ...current, playing: true };
		expect(stepAnalysis(current, 1)).toMatchObject({ cursor: 1, playing: false });
		expect(resetAnalysis({ ...current, cursor: 1 })).toMatchObject({ cursor: 0, playing: false });
	});

	it('clears immediately when structurally invalidated', () => {
		const current = createCurrentAnalysis('bfs', { start: 'A' }, output, 1);
		expect(invalidateAnalysis(current)).toBeNull();
	});
});
