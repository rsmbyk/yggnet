import { describe, expect, it } from 'vitest';
import type { GraphDocument } from '../model/types';
import {
	activeAnalysisFields,
	analysisDefinitions,
	normalizeAnalysisInput,
	validateAnalysisInput
} from './index';

function graph(edges: Array<[string, string, boolean?]>): GraphDocument {
	const ids = new Set(edges.flatMap(([from, to]) => [from, to]));
	return {
		schemaVersion: 1,
		id: 'traversal-test',
		title: 'Traversal test',
		createdAt: '2026-09-30T00:00:00.000Z',
		updatedAt: '2026-09-30T00:00:00.000Z',
		groupTagCounter: 0,
		nodes: Object.fromEntries(
			[...ids].map((id) => [
				id,
				{
					id,
					label: id,
					position: { x: 0, y: 0, z: 0 },
					pinned: false,
					tags: [],
					attachments: [],
					data: {}
				}
			])
		),
		edges: Object.fromEntries(
			edges.map(([from, to, directed = false], index) => [
				`e${index}`,
				{
					id: `e${index}`,
					from,
					to,
					directed,
					weight: 1,
					tags: [],
					attachments: [],
					data: {}
				}
			])
		)
	};
}

describe('mode-capable traversal contracts', () => {
	it('defaults BFS to Traverse and excludes the hidden Target value', () => {
		const bfs = analysisDefinitions.get('bfs')!;
		expect(normalizeAnalysisInput(bfs, { start: 'A', target: 'B' })).toEqual({
			mode: 'traverse',
			start: 'A'
		});
		expect(activeAnalysisFields(bfs, { mode: 'traverse' }).map((field) => field.id)).toEqual([
			'mode',
			'start'
		]);
	});

	it('requires Target only in BFS Search mode', () => {
		const bfs = analysisDefinitions.get('bfs')!;
		const doc = graph([['A', 'B']]);
		expect(validateAnalysisInput(bfs, doc, { mode: 'traverse', start: 'A' }).valid).toBe(true);
		expect(validateAnalysisInput(bfs, doc, { mode: 'search', start: 'A' }).fieldErrors).toEqual({
			target: 'Choose a node.'
		});
	});
});

describe('BFS Search', () => {
	it('returns a fewest-edge path and a separate explored-footprint reveal', () => {
		const output = analysisDefinitions.get('bfs')!.execute(
			graph([
				['A', 'B'],
				['A', 'C'],
				['B', 'D'],
				['C', 'E']
			]),
			{ mode: 'search', start: 'A', target: 'D' }
		);

		expect(output.result.outcome).toBe('complete');
		expect(output.result.artifacts).toContainEqual({
			kind: 'path',
			id: 'path',
			label: 'Found path',
			nodeIds: ['A', 'B', 'D'],
			edgeIds: ['e0', 'e2']
		});
		expect(output.result.artifacts).toContainEqual({
			kind: 'ordered-nodes',
			id: 'explored',
			label: 'Explored nodes',
			nodeIds: ['A', 'B', 'C', 'D']
		});
		expect(output.result.reveal?.phases).toHaveLength(1);
		expect(output.result.reveal?.phases[0].steps.at(-1)).toEqual({
			actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }]
		});
		expect(structuredClone(output.result.reveal)).toEqual(output.result.reveal);
	});
});

describe('depth-first definitions', () => {
	const doc = graph([
		['A', 'B'],
		['A', 'C'],
		['B', 'D'],
		['C', 'E']
	]);

	it('DFS traverses deterministically and Search returns the first DFS path', () => {
		const dfs = analysisDefinitions.get('dfs')!;
		expect(dfs).toBeDefined();
		expect(dfs.execute(doc, { mode: 'traverse', start: 'A' }).result.artifacts).toContainEqual({
			kind: 'ordered-nodes',
			id: 'traversal',
			label: 'Traversal order',
			nodeIds: ['A', 'B', 'D', 'C', 'E']
		});

		const search = dfs.execute(doc, { mode: 'search', start: 'A', target: 'E' });
		expect(search.result.artifacts).toContainEqual({
			kind: 'path',
			id: 'path',
			label: 'Found path',
			nodeIds: ['A', 'C', 'E'],
			edgeIds: ['e1', 'e3']
		});
		expect(search.result.metrics).toContainEqual({ label: 'Visited', value: 5 });
	});

	it('Depth-Limited DFS records cutoffs and finds only in-limit paths', () => {
		const dls = analysisDefinitions.get('depth-limited-dfs')!;
		expect(dls).toBeDefined();
		const shallow = dls.execute(doc, {
			mode: 'search',
			start: 'A',
			target: 'D',
			maxDepth: 1
		});
		expect(shallow.result.outcome).toBe('no-result');
		expect(shallow.events.filter((event) => event.action === 'cutoff')).toHaveLength(2);
		expect(shallow.result.artifacts.find((item) => item.id === 'explored')).toMatchObject({
			nodeIds: ['A', 'B', 'C']
		});

		const found = dls.execute(doc, {
			mode: 'search',
			start: 'A',
			target: 'D',
			maxDepth: 2
		});
		expect(found.result.outcome).toBe('complete');
		expect(found.result.artifacts.find((item) => item.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'D'],
			edgeIds: ['e0', 'e2']
		});
	});

	it('validates Depth-Limited DFS Max depth as a non-negative integer', () => {
		const dls = analysisDefinitions.get('depth-limited-dfs')!;
		expect(
			validateAnalysisInput(dls, doc, { mode: 'traverse', start: 'A', maxDepth: -1 }).fieldErrors
				.maxDepth
		).toBe('Must be at least 0.');
		expect(
			validateAnalysisInput(dls, doc, { mode: 'traverse', start: 'A', maxDepth: 1.5 }).fieldErrors
				.maxDepth
		).toBe('Must be a whole number.');
	});
});

describe('multi-frontier breadth-first definitions', () => {
	it('Multi-source BFS reveals concurrent waves and uses source order to break path ties', () => {
		const doc = graph([
			['A', 'C'],
			['B', 'D'],
			['C', 'T'],
			['D', 'T']
		]);
		const output = analysisDefinitions.get('multi-source-bfs')!.execute(doc, {
			mode: 'search',
			starts: ['B', 'A'],
			target: 'T'
		});

		expect(output.result.artifacts.find((item) => item.kind === 'path')).toMatchObject({
			nodeIds: ['B', 'D', 'T'],
			edgeIds: ['e1', 'e3']
		});
		expect(output.result.reveal?.phases[0].steps[0]).toEqual({
			actions: [
				{ kind: 'reveal-node', nodeId: 'B', role: 'source' },
				{ kind: 'reveal-node', nodeId: 'A', role: 'source' }
			]
		});
		expect(output.result.reveal?.phases[0].steps[1].actions).toEqual(
			expect.arrayContaining([
				{ kind: 'reveal-node', nodeId: 'D', role: 'frontier' },
				{ kind: 'reveal-node', nodeId: 'C', role: 'frontier' }
			])
		);
	});

	it('Multi-source BFS returns one combined forest in Traverse mode', () => {
		const output = analysisDefinitions.get('multi-source-bfs')!.execute(
			graph([
				['A', 'C'],
				['B', 'D']
			]),
			{ mode: 'traverse', starts: ['A', 'B'] }
		);
		expect(output.result.artifacts).toContainEqual({
			kind: 'ordered-nodes',
			id: 'traversal',
			label: 'Traversal order',
			nodeIds: ['A', 'B', 'C', 'D']
		});
		expect(output.result.artifacts.find((item) => item.kind === 'tree')).toMatchObject({
			edgeIds: ['e0', 'e1']
		});
	});

	it('Bidirectional BFS follows incoming directed edges from Target and reveals both sides together', () => {
		const output = analysisDefinitions.get('bidirectional-bfs')!.execute(
			graph([
				['A', 'B', true],
				['B', 'C', true],
				['C', 'D', true]
			]),
			{ start: 'A', target: 'D' }
		);

		expect(output.result.artifacts.find((item) => item.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'C', 'D'],
			edgeIds: ['e0', 'e1', 'e2']
		});
		expect(output.result.reveal?.phases[0].steps[0]).toEqual({
			actions: [
				{ kind: 'reveal-node', nodeId: 'A', role: 'start-side' },
				{ kind: 'reveal-node', nodeId: 'D', role: 'target-side' }
			]
		});
		expect(output.result.metrics).toContainEqual({ label: 'Length', value: 3 });
	});
});

describe('Iterative Deepening DFS', () => {
	it('restarts the reveal for every depth while keeping the final found depth metric', () => {
		const output = analysisDefinitions.get('iddfs')!.execute(
			graph([
				['A', 'B'],
				['B', 'C'],
				['C', 'D']
			]),
			{ mode: 'search', start: 'A', target: 'D' }
		);

		expect(output.result.outcome).toBe('complete');
		expect(output.result.metrics).toContainEqual({ label: 'Found depth', value: 3 });
		expect(output.result.reveal?.phases.map((phase) => phase.id)).toEqual([
			'depth-0',
			'depth-1',
			'depth-2',
			'depth-3'
		]);
		expect(output.result.reveal?.phases[1].steps[0]).toEqual({
			actions: [{ kind: 'reset-footprint' }]
		});
		expect(output.result.artifacts.find((item) => item.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'C', 'D']
		});
		expect(output.events.filter((event) => event.action === 'restart-depth')).toHaveLength(3);
	});

	it('Traverse stops when an iteration exhausts the reachable graph', () => {
		const output = analysisDefinitions.get('iddfs')!.execute(
			graph([
				['A', 'B'],
				['B', 'C'],
				['C', 'A']
			]),
			{ mode: 'traverse', start: 'A' }
		);
		expect(output.result.outcome).toBe('complete');
		expect(output.result.metrics).toContainEqual({ label: 'Explored depth', value: 2 });
		expect(output.result.reveal?.phases).toHaveLength(3);
	});
});

describe('Random Walk', () => {
	it('replays the same walk for the same seed and exposes the used seed', () => {
		const randomWalk = analysisDefinitions.get('random-walk')!;
		const doc = graph([
			['A', 'B'],
			['A', 'C'],
			['B', 'D'],
			['C', 'D']
		]);
		const input = { mode: 'traverse', start: 'A', maxSteps: 5, seed: 42 };
		const first = randomWalk.execute(doc, input);
		const second = randomWalk.execute(doc, input);
		expect(second).toEqual(first);
		expect(first.result.metrics).toContainEqual({ label: 'Seed', value: 42 });
		expect(first.effectiveInput).toMatchObject({ seed: 42, maxSteps: 5 });
	});

	it('marks revisits with a transient reveal action and never a badge action', () => {
		const output = analysisDefinitions.get('random-walk')!.execute(graph([['A', 'B']]), {
			mode: 'traverse',
			start: 'A',
			maxSteps: 3,
			seed: 7
		});
		const actions = output.result.reveal!.phases[0].steps.flatMap((step) => step.actions);
		expect(actions).toContainEqual({ kind: 'revisit-node', nodeId: 'A', viaEdgeId: 'e0' });
		expect(actions.some((action) => (action as { kind: string }).kind.includes('badge'))).toBe(
			false
		);
		expect(output.result.metrics).toContainEqual({ label: 'Unique nodes', value: 2 });
	});

	it('generates and retains an unsigned seed when the optional field is omitted', () => {
		const output = analysisDefinitions.get('random-walk')!.execute(graph([['A', 'B']]), {
			mode: 'search',
			start: 'A',
			target: 'B',
			maxSteps: 10
		});
		const seed = output.result.metrics.find((metric) => metric.label === 'Seed')?.value;
		expect(seed).toEqual(expect.any(Number));
		expect(seed).toBeGreaterThanOrEqual(0);
		expect(seed).toBeLessThanOrEqual(0xffffffff);
		expect(output.effectiveInput?.seed).toBe(seed);
		expect(output.result.outcome).toBe('complete');
	});
});
