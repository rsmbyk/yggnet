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

function withNodes(document: GraphDocument, ids: string[]): GraphDocument {
	return {
		...document,
		nodes: {
			...document.nodes,
			...Object.fromEntries(
				ids.map((id) => [
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
			)
		}
	};
}

describe('analysis contracts', () => {
	it('reports exact structural eccentricities for connected undirected graphs', () => {
		const output = analysisDefinitions.get('node-eccentricity')!.execute(
			graph([
				['A', 'B'],
				['B', 'C']
			]),
			{}
		);
		expect(
			output.result.artifacts.find((artifact) => artifact.id === 'eccentricities')
		).toMatchObject({
			rows: [
				['A', 2],
				['B', 1],
				['C', 2]
			]
		});
		expect(output.events.map((event) => event.action)).toEqual(
			expect.arrayContaining(['start-eccentricity-source', 'discover-eccentricity-node'])
		);
	});

	it('returns deterministic diameter, radius, and center results', () => {
		const network = graph([
			['A', 'B'],
			['B', 'C'],
			['C', 'D']
		]);
		expect(
			analysisDefinitions
				.get('graph-diameter')!
				.execute(network, {})
				.result.artifacts.find((artifact) => artifact.kind === 'path')
		).toMatchObject({ nodeIds: ['A', 'B', 'C', 'D'], edgeIds: ['e0', 'e1', 'e2'] });
		expect(
			analysisDefinitions
				.get('graph-radius')!
				.execute(network, {})
				.result.metrics.find((metric) => metric.label === 'Radius')?.value
		).toBe(2);
		expect(
			analysisDefinitions
				.get('graph-center')!
				.execute(network, {})
				.result.artifacts.find((artifact) => artifact.kind === 'node-set')
		).toMatchObject({ nodeIds: ['B', 'C'] });
		expect(
			analysisDefinitions
				.get('graph-diameter')!
				.execute(network, {})
				.events.map((event) => event.action)
		).toEqual(
			expect.arrayContaining(['consider-diameter-candidate', 'reconstruct-diameter-witness'])
		);
		expect(
			analysisDefinitions
				.get('graph-radius')!
				.execute(network, {})
				.events.map((event) => event.action)
		).toContain('update-radius-minimum');
		expect(
			analysisDefinitions
				.get('graph-center')!
				.execute(network, {})
				.events.map((event) => event.action)
		).toEqual(expect.arrayContaining(['select-center-radius', 'decide-center-membership']));
	});

	it('finds undirected multigraph girth including loops and parallel edges', () => {
		const loop = analysisDefinitions.get('graph-girth')!.execute(graph([['A', 'A']]), {}).result;
		expect(loop.metrics.find((metric) => metric.label === 'Girth')?.value).toBe(1);
		const parallel = analysisDefinitions.get('graph-girth')!.execute(
			graph([
				['A', 'B'],
				['A', 'B']
			]),
			{}
		).result;
		expect(parallel.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'A'],
			edgeIds: ['e0', 'e1']
		});
		const reversed = analysisDefinitions.get('graph-girth')!.execute(
			graph([
				['A', 'B'],
				['B', 'A']
			]),
			{}
		).result;
		expect(reversed.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'A'],
			edgeIds: ['e0', 'e1']
		});
		expect(
			analysisDefinitions
				.get('graph-girth')!
				.execute(graph([['A', 'A']]), {})
				.events.map((event) => event.action)
		).toEqual(expect.arrayContaining(['inspect-cycle-closing-edge', 'retain-shortest-cycle']));
	});

	it('computes simple-adjacency density without loop or parallel inflation', () => {
		const result = analysisDefinitions.get('graph-density')!.execute(
			graph([
				['A', 'B'],
				['A', 'B'],
				['A', 'A']
			]),
			{}
		).result;
		expect(result.metrics).toEqual(
			expect.arrayContaining([
				{ label: 'Density', value: 1 },
				{ label: 'Distinct adjacencies', value: 1 },
				{ label: 'Formula', value: 'm / (n(n - 1) / 2)' }
			])
		);
	});

	it('returns multigraph-aware degree frequency tables', () => {
		const result = analysisDefinitions
			.get('degree-distribution')!
			.execute(withNodes(graph([['A', 'A']]), ['B']), {}).result;
		expect(
			result.artifacts.find((artifact) => artifact.id === 'degree-distribution')
		).toMatchObject({
			rows: [
				[0, 1],
				[1, 0],
				[2, 1]
			]
		});
		expect(
			analysisDefinitions
				.get('degree-distribution')!
				.execute(withNodes(graph([['A', 'A']]), ['B']), {})
				.events.map((event) => event.action)
		).toContain('build-degree-buckets');
	});

	it('classifies trees, forests, and cyclic multigraphs', () => {
		const definition = analysisDefinitions.get('tree-forest-detection')!;
		expect(definition.execute(graph([['A', 'B']]), {}).result.summary).toContain('Tree');
		expect(definition.execute(withNodes(graph([]), ['A', 'B']), {}).result.summary).toContain(
			'Forest'
		);
		const cyclicOutput = definition.execute(
			graph([
				['A', 'B'],
				['A', 'B']
			]),
			{}
		);
		const cyclic = cyclicOutput.result;
		expect(cyclic.summary).toContain('Neither');
		expect(cyclic.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			edgeIds: ['e0', 'e1']
		});
		expect(cyclicOutput.events.map((event) => event.action)).toContain('inspect-forest-edge');
		expect(cyclicOutput.events.map((event) => event.action)).toEqual(
			expect.arrayContaining(['set-forest-parent-edge', 'check-forest-cycle', 'start-cycle-bfs'])
		);
		const trace = buildAnalysisTrace(cyclicOutput.events);
		expect(Object.values(frameAt(trace, trace.events.length).roles.edges).flat()).toHaveLength(0);
	});

	it('rejects non-finite whole-graph distance metric inputs', () => {
		const definitions = ['node-eccentricity', 'graph-diameter', 'graph-radius', 'graph-center'].map(
			(id) => analysisDefinitions.get(id)!
		);
		for (const definition of definitions) {
			expect(definition.execute(graph([]), {}).result.outcome).toBe('no-result');
			expect(definition.execute(graph([['A', 'B', 1, true]]), {}).result.summary).toContain(
				'undirected'
			);
			expect(definition.execute(withNodes(graph([]), ['A', 'B']), {}).result.summary).toContain(
				'connected'
			);
		}
		const singleton = withNodes(graph([]), ['A']);
		expect(
			analysisDefinitions
				.get('node-eccentricity')!
				.execute(singleton, {})
				.result.artifacts.find((artifact) => artifact.id === 'eccentricities')
		).toMatchObject({ rows: [['A', 0]] });
	});

	it('finds a deterministic ordinary girth cycle and rejects acyclic or directed graphs', () => {
		const definition = analysisDefinitions.get('graph-girth')!;
		const triangle = definition.execute(
			graph([
				['A', 'B'],
				['B', 'C'],
				['C', 'A']
			]),
			{}
		).result;
		expect(triangle.metrics.find((metric) => metric.label === 'Girth')?.value).toBe(3);
		expect(definition.execute(graph([['A', 'B']]), {}).result.summary).toContain('no cycle');
		expect(definition.execute(graph([['A', 'B', 1, true]]), {}).result.summary).toContain(
			'undirected'
		);
	});

	it('uses directed density formulas and rejects mixed direction', () => {
		const definition = analysisDefinitions.get('graph-density')!;
		const directed = definition.execute(graph([['A', 'B', 1, true]]), {}).result;
		expect(directed.metrics).toEqual(
			expect.arrayContaining([
				{ label: 'Density', value: 0.5 },
				{ label: 'Possible adjacencies', value: 2 }
			])
		);
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C']
				]),
				{}
			).result.outcome
		).toBe('rejected');
		expect(
			definition
				.execute(withNodes(graph([]), ['A']), {})
				.result.metrics.find((metric) => metric.label === 'Density')?.value
		).toBe(0);
	});

	it('returns directed in, out, and total degree distributions', () => {
		const definition = analysisDefinitions.get('degree-distribution')!;
		const result = definition.execute(
			graph([
				['A', 'A', 1, true],
				['A', 'B', 1, true]
			]),
			{}
		).result;
		expect(
			result.artifacts.find((artifact) => artifact.id === 'in-degree-distribution')
		).toMatchObject({
			rows: [
				[0, 0],
				[1, 2]
			]
		});
		expect(
			result.artifacts.find((artifact) => artifact.id === 'out-degree-distribution')
		).toMatchObject({
			rows: [
				[0, 1],
				[1, 0],
				[2, 1]
			]
		});
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C']
				]),
				{}
			).result.outcome
		).toBe('rejected');
	});

	it('treats loops and ordinary cycles as neither tree nor forest', () => {
		const definition = analysisDefinitions.get('tree-forest-detection')!;
		expect(definition.execute(graph([['A', 'A']]), {}).result.summary).toContain('Neither');
		expect(
			definition.execute(
				graph([
					['A', 'B'],
					['B', 'C'],
					['C', 'A']
				]),
				{}
			).result.summary
		).toContain('Neither');
		expect(definition.execute(graph([]), {}).result.outcome).toBe('no-result');
		expect(definition.execute(graph([['A', 'B', 1, true]]), {}).result.outcome).toBe('rejected');
	});
	it('finds deterministic Eulerian paths and circuits over every real edge', () => {
		const definition = analysisDefinitions.get('eulerian-route')!;
		const path = definition.execute(
			graph([
				['A', 'B'],
				['B', 'C']
			]),
			{ mode: 'path', start: 'A' }
		).result;
		expect(path.outcome).toBe('complete');
		expect(path.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'C'],
			edgeIds: ['e0', 'e1']
		});
		const trace = buildAnalysisTrace(
			definition.execute(graph([['A', 'B']]), { mode: 'path' }).events
		);
		expect(Object.values(frameAt(trace, trace.events.length).roles.edges).flat()).toHaveLength(0);
		expect(
			definition
				.execute(graph([['A', 'B']]), { mode: 'path' })
				.events.flatMap((entry) => entry.inspectors.map((update) => update.inspector))
		).toEqual(
			expect.arrayContaining([
				'current-node',
				'remaining-edges',
				'traversal-stack',
				'emitted-route'
			])
		);

		const circuit = definition.execute(
			graph([
				['A', 'A'],
				['A', 'B'],
				['A', 'B']
			]),
			{ mode: 'circuit', start: 'A' }
		).result;
		expect(circuit.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			edgeIds: ['e0', 'e1', 'e2']
		});
		expect(
			definition.execute(graph([['A', 'B']]), { mode: 'path', start: 'B' }).result.outcome
		).toBe('complete');
		expect(
			definition.execute(graph([['A', 'B']]), { mode: 'path', start: 'missing' }).result.outcome
		).toBe('no-result');
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C', 1, false]
				]),
				{ mode: 'path' }
			).result.outcome
		).toBe('rejected');
		const edgeless = definition.execute(withNodes(graph([]), ['solo']), { mode: 'circuit' }).result;
		expect(edgeless.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['solo'],
			edgeIds: []
		});
		expect(edgeless.metrics).toContainEqual({ label: 'Mode', value: 'Circuit' });
		expect(edgeless.metrics).toContainEqual({ label: 'Closed', value: 'Yes' });
	});

	it('finds exact Hamiltonian routes and explains the 20-node limit', () => {
		const definition = analysisDefinitions.get('hamiltonian-route')!;
		const output = definition.execute(
			graph([
				['A', 'B'],
				['B', 'C'],
				['C', 'A']
			]),
			{ mode: 'circuit', start: 'A' }
		);
		const result = output.result;
		expect(result.outcome).toBe('complete');
		expect(result.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'C', 'A'],
			edgeIds: ['e0', 'e1', 'e2']
		});
		expect(output.events).toContainEqual(
			expect.objectContaining({
				action: 'inspect-hamiltonian-transition',
				narration: expect.objectContaining({
					refs: expect.objectContaining({ visitedNodes: expect.any(Number) })
				})
			})
		);
		expect(
			output.events.flatMap((entry) => entry.inspectors.map((update) => update.inspector))
		).toEqual(
			expect.arrayContaining([
				'dp-states',
				'route-candidate',
				'parent-decisions',
				'reconstructed-route'
			])
		);
		expect(output.events.map((entry) => entry.action)).toContain('reconstruct-hamiltonian-route');
		expect(
			definition.execute(withNodes(graph([]), ['A']), { mode: 'circuit' }).result.outcome
		).toBe('no-result');
		expect(definition.execute(graph([['A', 'A']]), { mode: 'circuit' }).result.outcome).toBe(
			'complete'
		);
		const tooLarge = definition.execute(
			withNodes(
				graph([]),
				Array.from({ length: 21 }, (_, index) => `n${index}`)
			),
			{ mode: 'path' }
		).result;
		expect(tooLarge.outcome).toBe('no-result');
		expect(tooLarge.summary).toContain('20 nodes');
	});

	it('returns exact deterministic clique and independent-set memberships', () => {
		const network = withNodes(
			graph([
				['A', 'B'],
				['A', 'C'],
				['B', 'C'],
				['C', 'D'],
				['D', 'D']
			]),
			['E']
		);
		const cliqueOutput = analysisDefinitions.get('maximum-clique')!.execute(network, {});
		const clique = cliqueOutput.result;
		expect(clique.artifacts.find((artifact) => artifact.kind === 'node-set')).toMatchObject({
			nodeIds: ['A', 'B', 'C']
		});
		expect(cliqueOutput.events.map((event) => event.action)).toContain('inspect-exact-set-branch');
		expect(
			cliqueOutput.events.flatMap((entry) => entry.inspectors.map((update) => update.inspector))
		).toEqual(expect.arrayContaining(['current-set', 'candidate-set', 'upper-bound', 'best-set']));
		const independent = analysisDefinitions
			.get('maximum-independent-set')!
			.execute(network, {}).result;
		expect(independent.artifacts.find((artifact) => artifact.kind === 'node-set')).toMatchObject({
			nodeIds: ['A', 'E']
		});
		expect(
			analysisDefinitions.get('maximum-clique')!.execute(graph([['A', 'B', 1, true]]), {}).result
				.outcome
		).toBe('rejected');
	});

	it('returns a minimum vertex cover with forced loop nodes and direct tie ordering', () => {
		const definition = analysisDefinitions.get('minimum-vertex-cover')!;
		const output = definition.execute(
			graph([
				['A', 'B'],
				['B', 'C'],
				['C', 'C']
			]),
			{}
		);
		const result = output.result;
		expect(result.artifacts.find((artifact) => artifact.kind === 'node-set')).toMatchObject({
			nodeIds: ['A', 'C']
		});
		expect(output.events[0]).toMatchObject({
			action: 'initialize-cover',
			narration: { refs: { forcedNodes: 1 } }
		});
		expect(
			output.events.flatMap((entry) => entry.inspectors.map((update) => update.inspector))
		).toEqual(
			expect.arrayContaining([
				'forced-nodes',
				'current-cover',
				'uncovered-edge',
				'cover-bound',
				'best-cover'
			])
		);
		expect(output.events.map((entry) => entry.action)).toContain('update-best-cover');
		const edgeless = definition.execute(withNodes(graph([]), ['A', 'B']), {}).result;
		expect(edgeless.outcome).toBe('complete');
		expect(edgeless.artifacts.find((artifact) => artifact.kind === 'node-set')).toMatchObject({
			nodeIds: []
		});
	});

	it('applies the exact-set 20-node limit without a graph footprint', () => {
		const large = withNodes(
			graph([]),
			Array.from({ length: 21 }, (_, index) => `n${index}`)
		);
		for (const id of ['maximum-clique', 'maximum-independent-set', 'minimum-vertex-cover']) {
			const result = analysisDefinitions.get(id)!.execute(large, {}).result;
			expect(result.outcome).toBe('no-result');
			expect(result.summary).toContain('20 nodes');
			expect(result.reveal?.phases.flatMap((phase) => phase.steps) ?? []).toHaveLength(0);
		}
	});

	it('covers Eulerian eligibility boundaries for directed and disconnected graphs', () => {
		const definition = analysisDefinitions.get('eulerian-route')!;
		expect(definition.execute(graph([]), { mode: 'path' }).result.outcome).toBe('no-result');
		expect(
			definition.execute(
				graph([
					['A', 'B'],
					['C', 'D']
				]),
				{ mode: 'path' }
			).result.outcome
		).toBe('no-result');
		expect(
			definition.execute(
				graph([
					['A', 'B'],
					['A', 'C'],
					['A', 'D']
				]),
				{ mode: 'path' }
			).result.outcome
		).toBe('no-result');
		const directedPath = definition.execute(
			graph([
				['A', 'B', 1, true],
				['B', 'C', 1, true]
			]),
			{ mode: 'path' }
		).result;
		expect(directedPath.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'C']
		});
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['A', 'C', 1, true]
				]),
				{ mode: 'circuit' }
			).result.outcome
		).toBe('no-result');
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'A', 1, true]
				]),
				{ mode: 'circuit', start: 'B' }
			).result.outcome
		).toBe('complete');
	});

	it('covers Hamiltonian direction, start, and parallel-edge circuit boundaries', () => {
		const definition = analysisDefinitions.get('hamiltonian-route')!;
		expect(definition.execute(graph([]), { mode: 'path' }).result.outcome).toBe('no-result');
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C', 1, false]
				]),
				{ mode: 'path' }
			).result.outcome
		).toBe('rejected');
		expect(
			definition.execute(graph([['A', 'B']]), { mode: 'path', start: 'missing' }).result.outcome
		).toBe('no-result');
		expect(definition.execute(graph([['A', 'B']]), { mode: 'circuit' }).result.outcome).toBe(
			'no-result'
		);
		const parallel = definition.execute(
			graph([
				['A', 'B'],
				['A', 'B']
			]),
			{ mode: 'circuit' }
		).result;
		expect(parallel.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			edgeIds: ['e0', 'e1']
		});
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C', 1, true]
				]),
				{ mode: 'path', start: 'A' }
			).result.outcome
		).toBe('complete');
	});

	it('covers empty, loop-only, and boundary-sized exact node sets', () => {
		for (const id of ['maximum-clique', 'maximum-independent-set', 'minimum-vertex-cover']) {
			expect(analysisDefinitions.get(id)!.execute(graph([]), {}).result.outcome).toBe('no-result');
			expect(
				analysisDefinitions.get(id)!.execute(graph([['A', 'B', 1, true]]), {}).result.outcome
			).toBe('rejected');
		}
		const edgeless = withNodes(graph([]), ['A', 'B', 'C']);
		expect(
			analysisDefinitions
				.get('maximum-clique')!
				.execute(edgeless, {})
				.result.artifacts.find((artifact) => artifact.kind === 'node-set')
		).toMatchObject({ nodeIds: ['A'] });
		expect(
			analysisDefinitions
				.get('maximum-independent-set')!
				.execute(graph([['A', 'A']]), {})
				.result.artifacts.find((artifact) => artifact.kind === 'node-set')
		).toMatchObject({ nodeIds: [] });
		const twenty = withNodes(
			graph([]),
			Array.from({ length: 20 }, (_, index) => `n${index}`)
		);
		expect(
			analysisDefinitions.get('minimum-vertex-cover')!.execute(twenty, {}).result.outcome
		).toBe('complete');
	});
	it('computes the same maximum flow with all three deterministic strategies', () => {
		const network = graph([
			['S', 'A', 3, true],
			['S', 'B', 2, true],
			['A', 'B', 1, true],
			['A', 'T', 2, true],
			['B', 'T', 3, true]
		]);

		for (const id of ['ford-fulkerson', 'edmonds-karp', 'dinic-max-flow']) {
			const output = analysisDefinitions.get(id)!.execute(network, { source: 'S', sink: 'T' });
			expect(output.result.outcome).toBe('complete');
			expect(output.result.metrics.find((metric) => metric.label === 'Maximum flow')?.value).toBe(
				5
			);
			expect(
				output.result.artifacts.find((artifact) => artifact.kind === 'per-edge-values')
			).toMatchObject({
				values: { e0: 3, e1: 2, e2: 1, e3: 2, e4: 3 }
			});
			const trace = buildAnalysisTrace(output.events);
			const finalFrame = frameAt(trace, trace.events.length);
			expect(Object.values(finalFrame.roles.edges).every((roles) => roles.length === 0)).toBe(true);
			expect(finalFrame.inspectors['maximum-flow']).toMatchObject({ kind: 'scalar', value: 5 });
		}
	});

	it('returns the real minimum cut and matching max-flow capacity', () => {
		const network = graph([
			['S', 'A', 3, true],
			['S', 'B', 2, true],
			['A', 'T', 3, true],
			['B', 'T', 2, true]
		]);
		const output = analysisDefinitions.get('minimum-cut')!.execute(network, {
			source: 'S',
			sink: 'T'
		});

		expect(output.result.metrics.find((metric) => metric.label === 'Cut capacity')?.value).toBe(5);
		expect(output.result.artifacts.find((artifact) => artifact.kind === 'edge-set')).toMatchObject({
			edgeIds: ['e0', 'e1']
		});
		expect(output.result.artifacts.find((artifact) => artifact.kind === 'partition')).toMatchObject(
			{
				parts: [
					{ label: 'Source side', nodeIds: ['S'] },
					{ label: 'Sink side', nodeIds: ['A', 'B', 'T'] }
				]
			}
		);
		const downstreamCut = analysisDefinitions.get('minimum-cut')!.execute(
			graph([
				['S', 'A', 10, true],
				['A', 'T', 1, true]
			]),
			{ source: 'S', sink: 'T' }
		).result;
		expect(downstreamCut.artifacts.find((artifact) => artifact.kind === 'partition')).toMatchObject(
			{
				parts: [
					{ label: 'Source side', nodeIds: ['S', 'A'] },
					{ label: 'Sink side', nodeIds: ['T'] }
				]
			}
		);
	});

	it('uses reverse residual capacity to repair an earlier DFS augmentation', () => {
		const network = graph([
			['S', 'L1', 1, true],
			['S', 'L2', 1, true],
			['L1', 'R1', 1, true],
			['L1', 'R2', 1, true],
			['L2', 'R1', 1, true],
			['R1', 'T', 1, true],
			['R2', 'T', 1, true]
		]);
		const output = analysisDefinitions.get('ford-fulkerson')!.execute(network, {
			source: 'S',
			sink: 'T'
		});

		expect(output.result.metrics.find((metric) => metric.label === 'Maximum flow')?.value).toBe(2);
		expect(
			output.result.artifacts.find((artifact) => artifact.kind === 'per-edge-values')
		).toMatchObject({
			values: { e0: 1, e1: 1, e2: 0, e3: 1, e4: 1, e5: 1, e6: 1 }
		});
		const reverseEvent = output.events.find(
			(event) => event.narration.refs.reverseResidualSteps === 1
		);
		expect(reverseEvent?.inspectors).toContainEqual(
			expect.objectContaining({
				inspector: 'augmenting-path',
				value: expect.arrayContaining(['e2 (reverse residual)'])
			})
		);
		expect(reverseEvent?.roles).not.toContainEqual(expect.objectContaining({ id: 'e2' }));
	});

	it('skips dead ends while building a Dinic blocking flow', () => {
		const output = analysisDefinitions.get('dinic-max-flow')!.execute(
			graph([
				['S', 'A', 1, true],
				['S', 'B', 1, true],
				['B', 'T', 1, true]
			]),
			{ source: 'S', sink: 'T' }
		);
		expect(output.result.metrics).toContainEqual({ label: 'Maximum flow', value: 1 });
	});

	it('reuses a capacious prefix while completing one Dinic blocking-flow phase', () => {
		const output = analysisDefinitions.get('dinic-max-flow')!.execute(
			graph([
				['S', 'A', 2, true],
				['A', 'B', 1, true],
				['B', 'T', 1, true],
				['A', 'C', 1, true],
				['C', 'T', 1, true]
			]),
			{ source: 'S', sink: 'T' }
		);
		expect(output.result.metrics).toContainEqual({ label: 'Maximum flow', value: 2 });
		expect(output.events.filter((event) => event.action === 'build-level-graph')).toHaveLength(1);
	});

	it('supports parallel and zero capacities and rejects invalid flow networks', () => {
		const parallel = graph([
			['S', 'T', 2, true],
			['S', 'T', 3, true],
			['S', 'T', 0, true]
		]);
		expect(
			analysisDefinitions.get('edmonds-karp')!.execute(parallel, { source: 'S', sink: 'T' }).result
				.metrics[0].value
		).toBe(5);

		for (const invalid of [graph([['S', 'T', 1, false]]), graph([['S', 'T', -1, true]])]) {
			expect(
				analysisDefinitions.get('ford-fulkerson')!.execute(invalid, { source: 'S', sink: 'T' })
					.result.outcome
			).toBe('rejected');
		}
		expect(
			analysisDefinitions.get('dinic-max-flow')!.execute(parallel, { source: 'S', sink: 'S' })
				.result.outcome
		).toBe('rejected');
		expect(
			analysisDefinitions.get('edmonds-karp')!.execute(parallel, { source: 'missing', sink: 'T' })
				.result.outcome
		).toBe('no-result');
		expect(
			analysisDefinitions
				.get('dinic-max-flow')!
				.execute(graph([['S', 'T', Infinity, true]]), { source: 'S', sink: 'T' }).result.outcome
		).toBe('rejected');
		const disconnected = graph([
			['S', 'A', 1, true],
			['B', 'T', 1, true]
		]);
		expect(
			analysisDefinitions.get('ford-fulkerson')!.execute(disconnected, { source: 'S', sink: 'T' })
				.result.metrics
		).toContainEqual({ label: 'Maximum flow', value: 0 });
		const single = analysisDefinitions
			.get('minimum-cut')!
			.execute(graph([['S', 'T', 1, true]]), { source: 'S', sink: 'T' }).result;
		expect(single.metrics).toContainEqual({ label: 'Cut edges', value: 1 });
	});

	it('runs deterministic graph coloring definitions and rejects impossible colorings', () => {
		const triangle = graph([
			['A', 'B'],
			['B', 'C'],
			['C', 'A']
		]);
		const bipartite = analysisDefinitions.get('bipartite-check')!.execute(triangle, {});
		expect(bipartite.result.outcome).toBe('no-result');
		for (const id of ['greedy-coloring', 'welsh-powell-coloring', 'dsatur-coloring']) {
			const output = analysisDefinitions.get(id)!.execute(triangle, {});
			expect(output.result.outcome).toBe('complete');
			expect(output.result.metrics.find((metric) => metric.label === 'Colors')?.value).toBe(3);
			expect(output.result.artifacts[0]).toMatchObject({ kind: 'partition', id: 'colors' });
		}
		expect(
			analysisDefinitions.get('greedy-coloring')!.execute(graph([['A', 'A']]), {}).result
		).toMatchObject({
			outcome: 'rejected'
		});
	});

	it('finds a deterministic Hopcroft-Karp maximum matching', () => {
		const output = analysisDefinitions.get('hopcroft-karp')!.execute(
			graph([
				['A', 'X'],
				['A', 'Y'],
				['B', 'X']
			]),
			{}
		);
		expect(output.result.outcome).toBe('complete');
		expect(
			output.result.metrics.find((metric) => metric.label === 'Matching cardinality')?.value
		).toBe(2);
		expect(output.result.artifacts.find((artifact) => artifact.kind === 'edge-set')).toMatchObject({
			edgeIds: ['e1', 'e2']
		});
		expect(
			analysisDefinitions.get('hopcroft-karp')!.execute(
				graph([
					['A', 'B'],
					['B', 'C'],
					['C', 'A']
				]),
				{}
			).result.outcome
		).toBe('rejected');
	});

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

describe('additional shortest-path analyses', () => {
	it('runs 0–1 BFS only on binary-weight graphs', () => {
		const def = analysisDefinitions.get('zero-one-bfs')!;
		const valid = def.execute(
			graph([
				['A', 'B', 1, true],
				['A', 'C', 0, true],
				['C', 'B', 0, true]
			]),
			{ start: 'A', end: 'B' }
		);
		expect(valid.result.metrics).toContainEqual({ label: 'Cost', value: 0 });
		expect(
			def.execute(graph([['A', 'B', 2, true]]), { start: 'A', end: 'B' }).result.summary
		).toMatch(/0 or 1/);
	});

	it('supports Bellman–Ford negative edges but identifies target-relevant cycles', () => {
		const def = analysisDefinitions.get('bellman-ford')!;
		expect(
			def.execute(
				graph([
					['A', 'B', 2, true],
					['A', 'C', 4, true],
					['C', 'B', -3, true]
				]),
				{ start: 'A', end: 'B' }
			).result.metrics
		).toContainEqual({ label: 'Cost', value: 1 });
		expect(
			def.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C', -2, true],
					['C', 'B', -2, true],
					['C', 'D', 1, true]
				]),
				{ start: 'A', end: 'D' }
			).result.summary
		).toMatch(/negative cycle/i);
	});

	it('rejects non-DAGs and solves directed DAGs', () => {
		const def = analysisDefinitions.get('dag-shortest-path')!;
		expect(
			def.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'C', -3, true],
					['A', 'C', 2, true]
				]),
				{ start: 'A', end: 'C' }
			).result.metrics
		).toContainEqual({ label: 'Cost', value: -2 });
		expect(
			def.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'A', 1, true]
				]),
				{ start: 'A', end: 'B' }
			).result.summary
		).toMatch(/acyclic/i);
	});

	it('uses a safe A* fallback and bidirectional Dijkstra on a directed path', () => {
		const doc = graph([
			['A', 'B', 1, true],
			['B', 'C', 1, true],
			['A', 'C', 4, true]
		]);
		expect(analysisDefinitions.get('a-star')!.description).toMatch(/safely scaled/i);
		expect(
			analysisDefinitions.get('a-star')!.execute(doc, { start: 'A', end: 'C' }).result.metrics
		).toContainEqual({ label: 'Cost', value: 2 });
		expect(
			analysisDefinitions.get('bidirectional-dijkstra')!.execute(doc, { start: 'A', end: 'C' })
				.result.metrics
		).toContainEqual({ label: 'Cost', value: 2 });
	});

	it('covers ineligible and no-result shortest-path outcomes', () => {
		expect(
			analysisDefinitions
				.get('zero-one-bfs')!
				.execute(graph([['A', 'B', 0, true]]), { start: 'A', end: 'C' }).result.outcome
		).toBe('no-result');
		expect(
			analysisDefinitions.get('bellman-ford')!.execute(
				graph([
					['A', 'B', 1, true],
					['X', 'Y', -2, true],
					['Y', 'X', -2, true]
				]),
				{ start: 'A', end: 'B' }
			).result.metrics
		).toContainEqual({ label: 'Cost', value: 1 });
		expect(
			analysisDefinitions
				.get('dag-shortest-path')!
				.execute(graph([['A', 'B', 1, false]]), { start: 'A', end: 'B' }).result.summary
		).toMatch(/directed/i);
		expect(
			analysisDefinitions
				.get('a-star')!
				.execute(graph([['A', 'B', -1, true]]), { start: 'A', end: 'B' }).result.summary
		).toMatch(/non-negative/i);
		expect(
			analysisDefinitions
				.get('bidirectional-dijkstra')!
				.execute(graph([['A', 'B', 1, true]]), { start: 'B', end: 'A' }).result.outcome
		).toBe('no-result');
	});
});

describe('structural analysis catalog', () => {
	it('returns explicit no-results for empty full-graph analyses', () => {
		const empty = graph([]);
		for (const id of [
			'connected-components',
			'weakly-connected-components',
			'strongly-connected-components',
			'bridges',
			'articulation-points',
			'kruskal-mst',
			'prim-mst',
			'topological-sort',
			'directed-cycle-detection',
			'degree-centrality',
			'pagerank',
			'betweenness-centrality',
			'bipartite-check'
		]) {
			expect(analysisDefinitions.get(id)!.execute(empty, {}).result.outcome, id).toBe('no-result');
		}
		expect(
			analysisDefinitions.get('minimum-cut')!.execute(empty, { source: 'S', sink: 'T' }).result
				.outcome
		).toBe('no-result');
	});

	it('distinguishes connected, weak, and strong regions', () => {
		const undirected = graph([
			['A', 'B'],
			['C', 'D']
		]);
		expect(
			analysisDefinitions.get('connected-components')!.execute(undirected, {}).result.metrics
		).toContainEqual({ label: 'Components', value: 2 });

		const directed = graph([
			['A', 'B', 1, true],
			['B', 'A', 1, true],
			['B', 'C', 1, true]
		]);
		expect(
			analysisDefinitions.get('weakly-connected-components')!.execute(directed, {}).result.metrics
		).toContainEqual({ label: 'Components', value: 1 });
		expect(
			analysisDefinitions.get('strongly-connected-components')!.execute(directed, {}).result.metrics
		).toContainEqual({ label: 'Components', value: 2 });
		expect(
			analysisDefinitions.get('connected-components')!.execute(directed, {}).result.outcome
		).toBe('rejected');
		expect(
			analysisDefinitions.get('strongly-connected-components')!.execute(graph([['A', 'B']]), {})
				.result.metrics
		).toContainEqual({ label: 'Components', value: 1 });
	});

	it('finds bridges and articulation points without treating parallel edges as bridges', () => {
		const doc = graph([
			['A', 'B'],
			['A', 'B'],
			['B', 'C']
		]);
		expect(
			analysisDefinitions
				.get('bridges')!
				.execute(doc, {})
				.result.artifacts.find((artifact) => artifact.kind === 'edge-set')
		).toMatchObject({ edgeIds: ['e2'] });
		expect(
			analysisDefinitions
				.get('articulation-points')!
				.execute(doc, {})
				.result.artifacts.find((artifact) => artifact.kind === 'node-set')
		).toMatchObject({ nodeIds: ['B'] });
	});

	it('builds deterministic minimum spanning trees with equal total weight', () => {
		const doc = graph([
			['A', 'B', 1],
			['B', 'C', 2],
			['A', 'C', 4]
		]);
		for (const id of ['kruskal-mst', 'prim-mst']) {
			const result = analysisDefinitions.get(id)!.execute(doc, {}).result;
			expect(result.metrics).toContainEqual({ label: 'Total weight', value: 3 });
			expect(result.metrics).toContainEqual({ label: 'Edge count', value: 2 });
		}
		expect(
			analysisDefinitions.get('prim-mst')!.execute(graph([['A', 'B', 1, true]]), {}).result.outcome
		).toBe('rejected');
		const singleton = graph([['A', 'B']]);
		delete singleton.edges.e0;
		delete singleton.nodes.B;
		for (const id of ['kruskal-mst', 'prim-mst']) {
			expect(analysisDefinitions.get(id)!.execute(singleton, {}).result.metrics).toContainEqual({
				label: 'Total weight',
				value: 0
			});
		}
	});

	it('orders DAGs and identifies all directed cycle members', () => {
		const dag = graph([
			['A', 'B', 1, true],
			['A', 'C', 1, true],
			['B', 'D', 1, true],
			['C', 'D', 1, true]
		]);
		expect(
			analysisDefinitions
				.get('topological-sort')!
				.execute(dag, {})
				.result.artifacts.find((artifact) => artifact.kind === 'ordered-nodes')
		).toMatchObject({ nodeIds: ['A', 'B', 'C', 'D'] });
		const cyclic = graph([
			['A', 'B', 1, true],
			['B', 'A', 1, true],
			['B', 'C', 1, true]
		]);
		expect(
			analysisDefinitions
				.get('directed-cycle-detection')!
				.execute(cyclic, {})
				.result.artifacts.find((artifact) => artifact.kind === 'node-set')
		).toMatchObject({ nodeIds: ['A', 'B'] });
		expect(analysisDefinitions.get('topological-sort')!.execute(cyclic, {}).result.outcome).toBe(
			'no-result'
		);
		expect(
			analysisDefinitions.get('directed-cycle-detection')!.execute(dag, {}).result.summary
		).toMatch(/No directed cycles/i);
		for (const id of ['topological-sort', 'directed-cycle-detection']) {
			expect(analysisDefinitions.get(id)!.execute(graph([['A', 'B']]), {}).result.outcome).toBe(
				'rejected'
			);
		}
	});
});

describe('centrality and coloring catalog', () => {
	it('ranks every node with degree, PageRank, and betweenness centrality', () => {
		const doc = graph([
			['A', 'B', 1, true],
			['B', 'C', 1, true],
			['A', 'C', 1, true]
		]);
		for (const id of ['degree-centrality', 'pagerank', 'betweenness-centrality']) {
			const result = analysisDefinitions.get(id)!.execute(doc, {}).result;
			expect(result.outcome).toBe('complete');
			const ranking = result.artifacts.find((artifact) => artifact.kind === 'ranking');
			expect(
				ranking && 'entries' in ranking ? ranking.entries.map((entry) => entry.id) : []
			).toEqual(expect.arrayContaining(['A', 'B', 'C']));
		}
	});

	it('colors a bipartite graph and reports its stable two classes', () => {
		const doc = graph([
			['A', 'B', 1, true],
			['B', 'C'],
			['C', 'D', 1, true]
		]);
		const result = analysisDefinitions.get('bipartite-check')!.execute(doc, {}).result;
		expect(result.outcome).toBe('complete');
		expect(result.metrics).toContainEqual({ label: 'Colors', value: 2 });
		expect(result.artifacts[0]).toMatchObject({
			parts: [
				{ label: 'Color 1', nodeIds: ['A', 'C'] },
				{ label: 'Color 2', nodeIds: ['B', 'D'] }
			]
		});
		const parallel = analysisDefinitions.get('bipartite-check')!.execute(
			graph([
				['A', 'B'],
				['A', 'B']
			]),
			{}
		).result;
		expect(parallel.metrics).toContainEqual({ label: 'Colors', value: 2 });
	});
});
