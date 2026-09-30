import { afterEach, describe, expect, it } from 'vitest';
import type { AnalysisOutput } from '$lib/graph';
import { app } from './app.svelte';
import { createCurrentAnalysis } from './current-analysis';

const output: AnalysisOutput = {
	result: {
		outcome: 'complete',
		summary: 'Done',
		metrics: [],
		artifacts: [{ kind: 'ordered-nodes', id: 'order', label: 'Order', nodeIds: ['A'] }]
	},
	events: []
};

describe('analysis result replay', () => {
	afterEach(() => app.clearCurrentAnalysis());

	it('replays only the reveal without requesting camera framing', () => {
		const current = createCurrentAnalysis('bfs', { start: 'A' }, output, 0);
		app.analysis = {
			...app.analysis,
			current: { ...current, panel: 'result', reveal: 'complete' }
		};
		const frameEpoch = app.frameGraphEpoch;

		app.replayAnalysisResult();

		expect(app.analysis.current?.reveal).toBe('playing');
		expect(app.frameGraphEpoch).toBe(frameEpoch);
	});
});
