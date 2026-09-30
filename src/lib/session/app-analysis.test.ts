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
	afterEach(() => {
		app.clearCurrentAnalysis();
		app.analysis = {
			algorithmId: 'bfs',
			inputs: { bfs: {}, dijkstra: {} },
			validation: null,
			current: null
		};
	});

	it('materializes the first Mode option once and preserves a remembered selection', () => {
		app.analysis = { ...app.analysis, inputs: {} };

		app.setAnalysisAlgorithm('dfs');
		expect(app.analysis.inputs.dfs).toMatchObject({ mode: 'traverse' });

		app.setAnalysisInput('mode', 'search');
		app.setAnalysisAlgorithm('bfs');
		app.setAnalysisAlgorithm('dfs');
		expect(app.analysis.inputs.dfs).toMatchObject({ mode: 'search' });
	});

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
