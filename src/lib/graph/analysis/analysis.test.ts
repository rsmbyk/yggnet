import { describe, expect, it } from 'vitest';
import type { GraphDocument } from '../model/types';
import {
	TRACE_EVENT_LIMIT,
	analysisDefinitions,
	buildAnalysisTrace,
	frameAt,
	validateAnalysisInput
} from './index';
import type { AnalysisDefinition, AnalysisEvent } from './contracts';
import { emptyAnalysisFrame, reduceAnalysisEvent } from './reducer';

function graph(edges: Array<[string, string, number?, boolean?]>): GraphDocument {
	const ids = new Set(edges.flatMap(([from, to]) => [from, to]));
	return {
		schemaVersion: 1,
		id: 'test',
		title: 'Test',
		createdAt: '2026-01-01T00:00:00.000Z',
		updatedAt: '2026-01-01T00:00:00.000Z',
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
			edges.map(([from, to, weight = 1, directed = false], index) => [
				`e${index}`,
				{
					id: `e${index}`,
					from,
					to,
					directed,
					weight,
					tags: [],
					attachments: [],
					data: {}
				}
			])
		)
	};
}

describe('analysis contracts', () => {
	it('validates declarative fields and remains structured-clone safe', () => {
		const bfs = analysisDefinitions.get('bfs')!;
		expect(validateAnalysisInput(bfs, graph([['A', 'B']]), {})).toEqual({
			valid: false,
			fieldErrors: { start: 'Choose a node.' }
		});
		expect(validateAnalysisInput(bfs, graph([['A', 'B']]), { start: 'Z' }).fieldErrors).toEqual({
			start: 'Choose a node in the graph.'
		});
		const output = bfs.execute(graph([['A', 'B']]), { start: 'A' });
		expect(structuredClone(output)).toEqual(output);
	});

	it('reduces roles and inspectors and seeks backwards from checkpoints', () => {
		const trace = buildAnalysisTrace(
			[
				{
					sequence: 0,
					action: 'enqueue',
					narration: { key: 'enqueue', refs: { nodeId: 'A' } },
					roles: [{ entity: 'node', id: 'A', role: 'frontier', operation: 'add' }],
					inspectors: [{ inspector: 'queue', operation: 'enqueue', value: 'A' }]
				},
				{
					sequence: 1,
					action: 'settle',
					narration: { key: 'settle', refs: { nodeId: 'A' } },
					roles: [
						{ entity: 'node', id: 'A', role: 'frontier', operation: 'remove' },
						{ entity: 'node', id: 'A', role: 'settled', operation: 'add' }
					],
					inspectors: [
						{ inspector: 'queue', operation: 'dequeue' },
						{ inspector: 'visited', operation: 'add', value: 'A' }
					]
				}
			],
			1
		);
		expect(frameAt(trace, 0).roles.nodes.A).toEqual(['frontier']);
		expect(frameAt(trace, 1).roles.nodes.A).toEqual(['settled']);
		expect(frameAt(trace, 0).inspectors.queue.value).toEqual(['A']);
		expect(frameAt(trace, 1).inspectors.visited.value).toEqual(['A']);
		expect(trace.checkpoints).toHaveLength(2);
	});

	it('caps playback without preventing a completed result', () => {
		const events = Array.from({ length: TRACE_EVENT_LIMIT + 2 }, (_, sequence) => ({
			sequence,
			action: 'tick',
			narration: { key: 'tick', refs: {} },
			roles: [],
			inspectors: []
		}));
		const trace = buildAnalysisTrace(events);
		expect(trace.events).toHaveLength(TRACE_EVENT_LIMIT);
		expect(trace.truncated).toBe(true);
	});

	it('validates every declarative field kind and custom form rules', () => {
		const doc = graph([['A', 'B']]);
		const definition: AnalysisDefinition = {
			id: 'fields',
			name: 'Fields',
			category: 'Test',
			description: 'Test fields',
			fields: [
				{ kind: 'node-set', id: 'nodes', label: 'Nodes', required: true },
				{ kind: 'edge', id: 'edge', label: 'Edge' },
				{ kind: 'number', id: 'count', label: 'Count', min: 2, max: 4 },
				{ kind: 'boolean', id: 'flag', label: 'Flag' },
				{ kind: 'enum', id: 'choice', label: 'Choice', options: [{ value: 'yes', label: 'Yes' }] }
			],
			validate: (_snapshot, input) => (input.flag ? 'Custom rule failed.' : undefined),
			execute: () => ({
				result: { outcome: 'complete', summary: '', metrics: [], artifacts: [] },
				events: []
			})
		};
		expect(validateAnalysisInput(definition, doc, { nodes: [] }).fieldErrors.nodes).toBe(
			'This field is required.'
		);
		expect(
			validateAnalysisInput(definition, doc, { nodes: ['A'], edge: 'missing' }).fieldErrors.edge
		).toMatch(/graph/);
		expect(
			validateAnalysisInput(definition, doc, { nodes: ['A'], count: 1 }).fieldErrors.count
		).toBe('Must be at least 2.');
		expect(
			validateAnalysisInput(definition, doc, { nodes: ['A'], count: 5 }).fieldErrors.count
		).toBe('Must be at most 4.');
		expect(
			validateAnalysisInput(definition, doc, { nodes: ['A'], choice: 'no' }).fieldErrors.choice
		).toBe('Choose a valid option.');
		expect(
			validateAnalysisInput(definition, doc, {
				nodes: ['A'],
				edge: 'e0',
				count: 3,
				choice: 'yes',
				flag: true
			})
		).toMatchObject({ valid: false, formError: 'Custom rule failed.' });
		expect(
			validateAnalysisInput(definition, doc, {
				nodes: ['A'],
				edge: 'e0',
				count: 3,
				choice: 'yes',
				flag: false
			}).valid
		).toBe(true);
	});

	it('reduces all generic inspector operations and duplicate role changes', () => {
		const events: AnalysisEvent[] = [
			{
				sequence: 0,
				action: 'reset',
				narration: { key: 'reset', refs: {} },
				roles: [
					{ entity: 'edge', id: 'e0', role: 'result', operation: 'add' },
					{ entity: 'edge', id: 'e0', role: 'result', operation: 'add' }
				],
				inspectors: [
					{ inspector: 'map', operation: 'reset', kind: 'map' },
					{ inspector: 'stack', operation: 'reset', kind: 'stack' }
				]
			},
			{
				sequence: 1,
				action: 'mutate',
				narration: { key: 'mutate', refs: {} },
				roles: [{ entity: 'edge', id: 'e0', role: 'result', operation: 'remove' }],
				inspectors: [
					{ inspector: 'map', operation: 'set', key: 'A', value: 2 },
					{ inspector: 'scalar', operation: 'set', value: 7 },
					{ inspector: 'stack', operation: 'push', value: 'A' },
					{ inspector: 'stack', operation: 'add', value: 'A' },
					{ inspector: 'stack', operation: 'append', value: 'B' }
				]
			},
			{
				sequence: 2,
				action: 'remove',
				narration: { key: 'remove', refs: {} },
				roles: [],
				inspectors: [
					{ inspector: 'stack', operation: 'pop' },
					{ inspector: 'stack', operation: 'remove', value: 'missing' }
				]
			}
		];
		let frame = emptyAnalysisFrame();
		for (const item of events) frame = reduceAnalysisEvent(frame, item);
		expect(frame.roles.edges.e0).toEqual([]);
		expect(frame.inspectors.map.value).toEqual({ A: 2 });
		expect(frame.inspectors.scalar.value).toBe(7);
		expect(frame.inspectors.stack.value).toEqual(['A']);
		expect(frameAt(buildAnalysisTrace([]), 12)).toEqual(emptyAnalysisFrame());
	});
});

describe('BFS analysis', () => {
	it('returns exact reachable order, tree, queue state, and semantic actions', () => {
		const doc = graph([
			['A', 'B'],
			['A', 'C'],
			['A', 'D'],
			['B', 'E'],
			['C', 'F'],
			['E', 'G'],
			['E', 'H']
		]);
		const output = analysisDefinitions.get('bfs')!.execute(doc, { start: 'A' });
		expect(output.result.outcome).toBe('complete');
		expect(output.result.artifacts).toContainEqual({
			kind: 'ordered-nodes',
			id: 'traversal',
			label: 'Traversal order',
			nodeIds: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
		});
		expect(output.result.artifacts.find((item) => item.kind === 'tree')).toMatchObject({
			nodeIds: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'],
			edgeIds: ['e0', 'e1', 'e2', 'e3', 'e4', 'e5', 'e6']
		});
		expect(output.result.artifacts).toContainEqual({
			kind: 'landmarks',
			id: 'landmarks',
			label: 'Important nodes',
			entries: [{ nodeId: 'A', role: 'start' }]
		});
		expect(output.events.map((event) => event.action)).toEqual(
			expect.arrayContaining([
				'focus',
				'inspect',
				'enqueue',
				'dequeue',
				'visit',
				'settle',
				'accept-tree-edge'
			])
		);
		const final = frameAt(buildAnalysisTrace(output.events), output.events.length - 1);
		expect(final.inspectors.queue.value).toEqual([]);
		expect(final.inspectors.visited.value).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);
	});

	it('respects directed edges and stays within the reachable component', () => {
		const output = analysisDefinitions.get('bfs')!.execute(
			graph([
				['A', 'B', 1, true],
				['C', 'A', 1, true]
			]),
			{ start: 'A' }
		);
		expect(output.result.artifacts[0]).toMatchObject({ nodeIds: ['A', 'B'] });
	});

	it('handles a single isolated start node', () => {
		const doc = graph([['A', 'B']]);
		delete doc.edges.e0;
		delete doc.nodes.B;
		const output = analysisDefinitions.get('bfs')!.execute(doc, { start: 'A' });
		expect(output.result.summary).toBe('Visited 1 node.');
	});
});

describe('Dijkstra analysis', () => {
	it('returns a weighted directed path with Length and Cost', () => {
		const output = analysisDefinitions.get('dijkstra')!.execute(
			graph([
				['A', 'B', 2, true],
				['A', 'C', 1, true],
				['C', 'B', 0.5, true]
			]),
			{ start: 'A', end: 'B' }
		);
		expect(output.result).toMatchObject({
			outcome: 'complete',
			metrics: [
				{ label: 'Length', value: 2 },
				{ label: 'Cost', value: 1.5 }
			],
			artifacts: [
				{ kind: 'path', nodeIds: ['A', 'C', 'B'], edgeIds: ['e1', 'e2'] },
				{
					kind: 'landmarks',
					entries: [
						{ nodeId: 'A', role: 'start' },
						{ nodeId: 'B', role: 'end' }
					]
				}
			]
		});
	});

	it('handles Start=End and unreachable targets as valid outcomes', () => {
		const def = analysisDefinitions.get('dijkstra')!;
		const doc = graph([
			['A', 'B'],
			['C', 'D']
		]);
		const sameNode = def.execute(doc, { start: 'A', end: 'A' }).result;
		expect(sameNode).toMatchObject({
			outcome: 'complete',
			metrics: [
				{ label: 'Length', value: 0 },
				{ label: 'Cost', value: 0 }
			]
		});
		expect(sameNode.artifacts).toContainEqual({
			kind: 'landmarks',
			id: 'landmarks',
			label: 'Important nodes',
			entries: [
				{ nodeId: 'A', role: 'start' },
				{ nodeId: 'A', role: 'end' }
			]
		});
		expect(def.execute(doc, { start: 'A', end: 'D' }).result.outcome).toBe('no-result');
	});

	it('rejects a reachable negative edge before execution', () => {
		const def = analysisDefinitions.get('dijkstra')!;
		const validation = validateAnalysisInput(
			def,
			graph([
				['A', 'B', -1],
				['X', 'Y', -2]
			]),
			{
				start: 'A',
				end: 'B'
			}
		);
		expect(validation.valid).toBe(false);
		expect(validation.formError).toMatch(/negative/i);
	});

	it('keeps the best relaxation and reports a singular edge path', () => {
		const output = analysisDefinitions.get('dijkstra')!.execute(
			graph([
				['A', 'B', 1],
				['A', 'C', 5],
				['B', 'C', 1],
				['A', 'C', 9]
			]),
			{ start: 'A', end: 'B' }
		);
		expect(output.result.summary).toContain('1 edge.');
		expect(output.result.metrics).toContainEqual({ label: 'Cost', value: 1 });
	});
});
