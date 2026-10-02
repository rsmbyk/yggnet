import { afterEach, describe, expect, it } from 'vitest';
import { createEmptyDocument, type AnalysisOutput } from '$lib/graph';
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

	it('preserves compatible shared fields when switching away and back', () => {
		const document = createEmptyDocument();
		app.replaceDocument(document);
		const start = app.addNode({ label: 'Start' });
		const end = app.addNode({ label: 'End' });

		app.setAnalysisAlgorithm('iddfs');
		app.setAnalysisInput('start', start);
		app.setAnalysisInput('target', end);
		app.setAnalysisInput('mode', 'search');
		app.setAnalysisAlgorithm('bfs');

		expect(app.analysis.inputs.bfs).toMatchObject({
			start,
			target: end,
			mode: 'search'
		});

		app.setAnalysisAlgorithm('topological-sort');
		app.setAnalysisAlgorithm('iddfs');
		expect(app.analysis.inputs.iddfs).toMatchObject({
			start,
			target: end,
			mode: 'search'
		});
	});

	it('retains a cached mode while an intermediate algorithm has different options', () => {
		app.setAnalysisAlgorithm('iddfs');
		app.setAnalysisInput('mode', 'search');
		app.setAnalysisAlgorithm('eulerian-route');
		expect(app.analysis.inputs['eulerian-route']?.mode).toBe('path');
		app.setAnalysisAlgorithm('iddfs');
		expect(app.analysis.inputs.iddfs?.mode).toBe('search');
	});

	it('drops cached shared node values after their nodes leave the graph', () => {
		app.replaceDocument(createEmptyDocument());
		const start = app.addNode({ label: 'Start' });
		app.setAnalysisAlgorithm('dfs');
		app.setAnalysisInput('start', start);
		app.replaceDocument(createEmptyDocument());
		app.setAnalysisAlgorithm('bfs');
		expect(app.analysis.inputs.bfs?.start).toBeUndefined();
	});

	it('opens a Rejected result for a graph precondition error', () => {
		app.replaceDocument(createEmptyDocument());
		const start = app.addNode({ label: 'Start' });
		const end = app.addNode({ label: 'End' });
		app.addEdge(start, end, { weight: -1 });
		app.setAnalysisAlgorithm('dijkstra');
		app.setAnalysisInput('start', start);
		app.setAnalysisInput('end', end);

		expect(app.runAnalysis()).toBe(true);
		expect(app.analysis.current?.result.outcome).toBe('rejected');
		expect(app.analysis.current?.result.summary).toContain('negative weight');
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
