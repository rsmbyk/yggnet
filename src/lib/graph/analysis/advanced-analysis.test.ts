import { describe, expect, it } from 'vitest';
import type { GraphDocument, GraphEdge, GraphNode } from '../model/types';
import { analysisDefinitions } from './index';

function graph(
	edges: Array<[string, string, number?, boolean?]>,
	extraNodes: string[] = []
): GraphDocument {
	const nodeIds = [...new Set([...edges.flatMap(([from, to]) => [from, to]), ...extraNodes])];
	const nodes = Object.fromEntries(
		nodeIds.map((id): [string, GraphNode] => [
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
	);
	const edgeMap = Object.fromEntries(
		edges.map(([from, to, weight = 1, directed = false], index): [string, GraphEdge] => [
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
	);
	return {
		schemaVersion: 1,
		id: 'test',
		title: 'Test',
		createdAt: '2026-10-02T00:00:00.000Z',
		updatedAt: '2026-10-02T00:00:00.000Z',
		groupTagCounter: 0,
		nodes,
		edges: edgeMap
	};
}

function rotationFaceCount(network: GraphDocument, rows: Array<[string, string[]]>): number {
	const incidenceRows = new Map<string, string[]>();
	const dartAtIncidence = new Map<string, string>();
	for (const [nodeId, edgeIds] of rows) {
		const counts = new Map<string, number>();
		incidenceRows.set(
			nodeId,
			edgeIds.map((edgeId) => {
				const ordinal = counts.get(edgeId) ?? 0;
				counts.set(edgeId, ordinal + 1);
				return `${edgeId}#${ordinal}`;
			})
		);
	}
	const darts: Array<{ key: string; edgeId: string; from: string; to: string; ordinal: number }> =
		[];
	for (const edge of Object.values(network.edges)) {
		const isLoop = edge.from === edge.to;
		const halfEdges = isLoop ? 2 : 1;
		for (let ordinal = 0; ordinal < halfEdges; ordinal++) {
			const key = `${edge.id}:${ordinal}`;
			darts.push({ key, edgeId: edge.id, from: edge.from, to: edge.to, ordinal });
			dartAtIncidence.set(`${edge.from}|${edge.id}#${ordinal}`, key);
			if (!isLoop) {
				const reverseKey = `${edge.id}:reverse`;
				darts.push({ key: reverseKey, edgeId: edge.id, from: edge.to, to: edge.from, ordinal: 0 });
				dartAtIncidence.set(`${edge.to}|${edge.id}#0`, reverseKey);
			}
		}
	}
	const nextDart = new Map<string, string>();
	for (const dart of darts) {
		const reverseOrdinal = dart.from === dart.to ? 1 - dart.ordinal : 0;
		const around = incidenceRows.get(dart.to)!;
		const reverseIndex = around.indexOf(`${dart.edgeId}#${reverseOrdinal}`);
		const nextIncidence = around[(reverseIndex + 1) % around.length];
		const [edgeId, ordinal] = nextIncidence.split('#');
		nextDart.set(dart.key, dartAtIncidence.get(`${dart.to}|${edgeId}#${ordinal}`)!);
	}
	const seen = new Set<string>();
	let faces = 0;
	for (const dart of darts) {
		if (seen.has(dart.key)) continue;
		faces++;
		let current = dart.key;
		while (!seen.has(current)) {
			seen.add(current);
			current = nextDart.get(current)!;
		}
	}
	return faces || 1;
}

describe('accepted Analyze extensions', () => {
	it('registers each accepted algorithm under its stable picker id', () => {
		expect(
			[
				'louvain-community-detection',
				'label-propagation',
				'traveling-salesman',
				'chinese-postman',
				'planarity-test',
				'planar-embedding'
			].every((id) => analysisDefinitions.has(id))
		).toBe(true);
	});

	it('Louvain separates two dense groups joined by a weak edge', () => {
		const output = analysisDefinitions.get('louvain-community-detection')!.execute(
			graph([
				['A', 'B', 1],
				['A', 'C', 1],
				['B', 'C', 1],
				['D', 'E', 1],
				['D', 'F', 1],
				['E', 'F', 1],
				['C', 'D', 0.1]
			]),
			{}
		);
		const partition = output.result.artifacts.find((artifact) => artifact.kind === 'partition');
		expect(partition).toMatchObject({
			parts: [{ nodeIds: ['A', 'B', 'C'] }, { nodeIds: ['D', 'E', 'F'] }]
		});
		expect(
			output.result.metrics.find((metric) => metric.label === 'Modularity')?.value
		).toBeGreaterThan(0);
		expect(output.result.reveal?.phases).toHaveLength(2);
		expect(output.result.metrics.find((metric) => metric.label === 'Nodes')?.value).toBe(6);
	});

	it('Label Propagation is deterministic and returns its weighted partition', () => {
		const network = graph([
			['A', 'B', 1],
			['B', 'C', 1],
			['C', 'D', 1],
			['D', 'E', 1],
			['E', 'F', 1]
		]);
		const definition = analysisDefinitions.get('label-propagation')!;
		const first = definition.execute(network, {});
		const second = definition.execute(network, {});
		expect(first.result.artifacts.find((artifact) => artifact.kind === 'partition')).toEqual(
			second.result.artifacts.find((artifact) => artifact.kind === 'partition')
		);
		expect(first.result.metrics.find((metric) => metric.label === 'Modularity')?.value).toEqual(
			expect.any(Number)
		);
	});

	it('community methods reject directed graphs and keep zero-strength nodes separate', () => {
		for (const id of ['louvain-community-detection', 'label-propagation']) {
			const definition = analysisDefinitions.get(id)!;
			expect(definition.execute(graph([['A', 'B', 1, true]]), {}).result.summary).toContain(
				'undirected'
			);
			const zero = definition.execute(graph([['A', 'B', 0]], ['C']), {});
			expect(zero.result.artifacts.find((artifact) => artifact.kind === 'partition')).toMatchObject(
				{
					parts: [{ nodeIds: ['A'] }, { nodeIds: ['B'] }, { nodeIds: ['C'] }]
				}
			);
		}
		expect(
			analysisDefinitions.get('louvain-community-detection')!.execute(graph([['A', 'B', -1]]), {})
				.result.summary
		).toContain('nonnegative');
	});

	it('Traveling Salesman returns the minimum-cost closed tour using stored edges', () => {
		const output = analysisDefinitions.get('traveling-salesman')!.execute(
			graph([
				['A', 'B', 1],
				['B', 'C', 1],
				['C', 'D', 1],
				['D', 'A', 1],
				['A', 'C', 20],
				['B', 'D', 20]
			]),
			{}
		);
		expect(output.result.metrics.find((metric) => metric.label === 'Total cost')?.value).toBe(4);
		expect(output.result.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'C', 'D', 'A'],
			edgeIds: ['e0', 'e1', 'e2', 'e3']
		});
	});

	it('Traveling Salesman requires distinct real edges for a two-node circuit', () => {
		const output = analysisDefinitions.get('traveling-salesman')!.execute(
			graph([
				['A', 'B', -2],
				['A', 'B', 3]
			]),
			{}
		);
		expect(output.result.outcome).toBe('complete');
		expect(output.result.metrics.find((metric) => metric.label === 'Total cost')?.value).toBe(1);
		expect(output.result.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'B', 'A'],
			edgeIds: ['e0', 'e1']
		});
	});

	it('Traveling Salesman explains mixed directions and exact-size limits', () => {
		const definition = analysisDefinitions.get('traveling-salesman')!;
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'A', 1]
				]),
				{}
			).result.summary
		).toContain('same direction');
		const oversized = graph(
			[],
			Array.from({ length: 21 }, (_, index) => `N${index}`)
		);
		expect(definition.execute(oversized, {}).result.summary).toContain('20 nodes');
	});

	it('Traveling Salesman handles the single-node loop and unsatisfied tours', () => {
		const definition = analysisDefinitions.get('traveling-salesman')!;
		expect(
			definition
				.execute(graph([['A', 'A', -3]]), {})
				.result.metrics.find((m) => m.label === 'Total cost')?.value
		).toBe(-3);
		expect(definition.execute(graph([['A', 'B']]), {}).result.summary).toContain('No closed tour');
		expect(
			definition.execute(
				graph([
					['A', 'B', 1, true],
					['B', 'A', 1, true]
				]),
				{}
			).result.outcome
		).toBe('complete');
		expect(definition.execute(graph([['A', 'B', Number.NaN]]), {}).result.summary).toContain(
			'finite'
		);
	});

	it('Traveling Salesman chooses the cheapest singleton loop and traces special cases', () => {
		const definition = analysisDefinitions.get('traveling-salesman')!;
		const singleton = definition.execute(
			graph([
				['A', 'A', 10],
				['A', 'A', 1]
			]),
			{}
		);
		expect(singleton.result.metrics.find((metric) => metric.label === 'Total cost')?.value).toBe(1);
		expect(singleton.result.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			edgeIds: ['e1']
		});
		expect(singleton.events.some((event) => event.action.includes('traveling-salesman'))).toBe(
			true
		);
	});

	it('Chinese Postman duplicates the cheapest real path to pair odd nodes', () => {
		const output = analysisDefinitions.get('chinese-postman')!.execute(
			graph([
				['A', 'B', 1],
				['B', 'C', 2]
			]),
			{}
		);
		expect(output.result.metrics.find((metric) => metric.label === 'Total cost')?.value).toBe(6);
		const route = output.result.artifacts.find((artifact) => artifact.kind === 'path');
		expect(route?.edgeIds).toHaveLength(4);
		expect(route?.edgeIds).toEqual(expect.arrayContaining(['e0', 'e1']));
		expect(route?.nodeIds[0]).toBe(route?.nodeIds.at(-1));
	});

	it('Chinese Postman rejects disconnected edge regions and directed inputs', () => {
		const definition = analysisDefinitions.get('chinese-postman')!;
		expect(
			definition.execute(
				graph([
					['A', 'B'],
					['C', 'D']
				]),
				{}
			).result.summary
		).toContain('Disconnected edge regions');
		expect(definition.execute(graph([['A', 'B', 1, true]]), {}).result.summary).toContain(
			'undirected'
		);
	});

	it('Chinese Postman returns a trivial edgeless route and preserves loop traversal', () => {
		const definition = analysisDefinitions.get('chinese-postman')!;
		const emptyRoute = definition.execute(graph([], ['alone']), {});
		expect(emptyRoute.result.outcome).toBe('complete');
		expect(emptyRoute.result.metrics.find((metric) => metric.label === 'Total cost')?.value).toBe(
			0
		);
		const loopRoute = definition.execute(graph([['A', 'A', 2]]), {});
		expect(
			loopRoute.result.metrics.find((metric) => metric.label === 'Total traversals')?.value
		).toBe(1);
		expect(loopRoute.result.artifacts.find((artifact) => artifact.kind === 'path')).toMatchObject({
			nodeIds: ['A', 'A'],
			edgeIds: ['e0']
		});
		expect(definition.execute(graph([['A', 'B', -1]]), {}).result.summary).toContain('nonnegative');
	});

	it('Chinese Postman deterministically pairs four odd leaves and reports duplicated work', () => {
		const output = analysisDefinitions.get('chinese-postman')!.execute(
			graph([
				['O', 'A', 1],
				['O', 'B', 1],
				['O', 'C', 1],
				['O', 'D', 1]
			]),
			{}
		);
		expect(
			output.result.metrics.find((metric) => metric.label === 'Repeated traversals')?.value
		).toBe(4);
		expect(output.result.metrics.find((metric) => metric.label === 'Total traversals')?.value).toBe(
			8
		);
		expect(output.events.some((entry) => entry.action === 'duplicate-postman-edge-traversal')).toBe(
			true
		);
		expect(output.events.some((entry) => entry.action === 'complete-postman-shortest-paths')).toBe(
			true
		);
		expect(
			output.events.some((entry) =>
				entry.roles.some(
					(role) =>
						role.entity === 'node' && role.role === 'inspecting' && role.operation === 'remove'
				)
			)
		).toBe(true);
	});

	it('Chinese Postman prefers the earliest stored edge among equal shortest paths', () => {
		const output = analysisDefinitions.get('chinese-postman')!.execute(
			graph([
				['B', 'A', 1],
				['A', 'C', 1],
				['B', 'D', 1],
				['D', 'C', 1],
				['B', 'C', 3]
			]),
			{}
		);
		const route = output.result.artifacts.find((artifact) => artifact.kind === 'path');
		expect(route?.edgeIds?.filter((edgeId) => edgeId === 'e0')).toHaveLength(2);
		expect(route?.edgeIds?.filter((edgeId) => edgeId === 'e1')).toHaveLength(2);
	});

	it('Planarity Test classifies planar and nonplanar graphs', () => {
		const definition = analysisDefinitions.get('planarity-test')!;
		expect(
			definition.execute(
				graph([
					['A', 'B'],
					['B', 'C'],
					['C', 'A']
				]),
				{}
			).result.summary
		).toContain('Planar');
		expect(
			definition.execute(
				graph([
					['A', 'B'],
					['A', 'C'],
					['A', 'D'],
					['A', 'E'],
					['B', 'C'],
					['B', 'D'],
					['B', 'E'],
					['C', 'D'],
					['C', 'E'],
					['D', 'E']
				]),
				{}
			).result.summary
		).toContain('Nonplanar');
		const bipartiteK33 = graph(
			['A', 'B', 'C'].flatMap((left) =>
				['D', 'E', 'F'].map((right) => [left, right] as [string, string])
			)
		);
		expect(definition.execute(bipartiteK33, {}).result.summary).toContain('Nonplanar');
		const subdivided = graph([
			['A', 'X'],
			['X', 'D'],
			['A', 'E'],
			['A', 'F'],
			['B', 'D'],
			['B', 'E'],
			['B', 'F'],
			['C', 'D'],
			['C', 'E'],
			['C', 'F']
		]);
		expect(definition.execute(subdivided, {}).result.summary).toContain('Nonplanar');
	});

	it('left-right test covers triangulated, bipartite, and disconnected planar cases', () => {
		const test = analysisDefinitions.get('planarity-test')!;
		const embedding = analysisDefinitions.get('planar-embedding')!;
		const k5MinusEdge = graph(
			['A', 'B', 'C', 'D', 'E'].flatMap((left, i, all) =>
				all
					.slice(i + 1)
					.filter((right) => !(left === 'A' && right === 'B'))
					.map((right) => [left, right] as [string, string])
			)
		);
		expect(test.execute(k5MinusEdge, {}).result.summary).toContain('Planar');
		const k33MinusEdge = graph(
			['A', 'B', 'C'].flatMap((left) =>
				['D', 'E', 'F']
					.filter((right) => !(left === 'A' && right === 'D'))
					.map((right) => [left, right] as [string, string])
			)
		);
		expect(test.execute(k33MinusEdge, {}).result.summary).toContain('Planar');
		const wheel = graph([
			['A', 'B'],
			['B', 'C'],
			['C', 'D'],
			['D', 'E'],
			['E', 'A'],
			['Z', 'A'],
			['Z', 'B'],
			['Z', 'C'],
			['Z', 'D'],
			['Z', 'E']
		]);
		const wheelOutput = embedding.execute(wheel, {});
		const table = wheelOutput.result.artifacts.find((artifact) => artifact.kind === 'table');
		if (table?.kind !== 'table') throw new Error('Expected wheel rotation system');
		const rows = table.rows.map(
			([id, edgeIds]) => [id as string, edgeIds as string[]] as [string, string[]]
		);
		expect(
			Object.keys(wheel.nodes).length -
				Object.keys(wheel.edges).length +
				rotationFaceCount(wheel, rows)
		).toBe(2);
		expect(
			test.execute(
				graph([
					['A', 'B'],
					['C', 'D']
				]),
				{}
			).result.summary
		).toContain('Planar');
	});

	it('planar rotation systems satisfy Euler characteristic across varied six-node graphs', () => {
		const test = analysisDefinitions.get('planarity-test')!;
		const embedding = analysisDefinitions.get('planar-embedding')!;
		const ids = ['A', 'B', 'C', 'D', 'E', 'F'];
		const pairs: Array<[string, string]> = [];
		for (let left = 0; left < ids.length; left++)
			for (let right = left + 1; right < ids.length; right++) pairs.push([ids[left], ids[right]]);
		let random = 73;
		for (let sample = 0; sample < 160; sample++) {
			random = (random * 48_271) % 2_147_483_647;
			const mask = random % (1 << pairs.length);
			const edges = pairs.filter((_pair, index) => mask & (1 << index));
			const network = graph(edges, ids);
			const classification = test.execute(network, {});
			expect(classification.result.outcome).toBe('complete');
			if (!classification.result.summary.startsWith('Planar:')) continue;
			const result = embedding.execute(network, {});
			const table = result.result.artifacts.find((artifact) => artifact.kind === 'table');
			if (table?.kind !== 'table') throw new Error('Expected a rotation system for a planar graph');
			const rows = table.rows.map(
				([id, edgeIds]) => [id as string, edgeIds as string[]] as [string, string[]]
			);
			const parent = ids.map((_id, index) => index);
			const root = (value: number): number =>
				parent[value] === value ? value : (parent[value] = root(parent[value]));
			for (const [from, to] of edges) parent[root(ids.indexOf(from))] = root(ids.indexOf(to));
			const components = new Set(ids.map((_id, index) => root(index))).size;
			const edgeComponents = new Set(
				[...new Set(edges.flatMap(([from, to]) => [from, to]))].map((id) => root(ids.indexOf(id)))
			).size;
			const globalFaces = rotationFaceCount(network, rows) - Math.max(0, edgeComponents - 1);
			if (ids.length - edges.length + globalFaces !== components + 1)
				throw new Error(
					`Bad planar rotation at sample ${sample}: ${JSON.stringify({ edges, rows, faces: globalFaces })}`
				);
		}
	});

	it('planarity analyses reject empty/directed input and nonplanar embeddings', () => {
		const test = analysisDefinitions.get('planarity-test')!;
		const embedding = analysisDefinitions.get('planar-embedding')!;
		expect(test.execute(graph([]), {}).result.outcome).toBe('no-result');
		expect(test.execute(graph([['A', 'B', 1, true]]), {}).result.summary).toContain('undirected');
		const k5Edges: Array<[string, string]> = [];
		const nodes = ['A', 'B', 'C', 'D', 'E'];
		for (let i = 0; i < nodes.length; i++)
			for (let j = i + 1; j < nodes.length; j++) k5Edges.push([nodes[i], nodes[j]]);
		expect(embedding.execute(graph(k5Edges), {}).result.summary).toContain('nonplanar');
	});

	it('Planar Embedding returns a rotation row for every node', () => {
		const network = graph(
			[
				['A', 'B'],
				['B', 'C'],
				['C', 'D'],
				['D', 'A'],
				['A', 'C']
			],
			['isolated']
		);
		const output = analysisDefinitions.get('planar-embedding')!.execute(network, {});
		expect(output.result.artifacts.find((artifact) => artifact.kind === 'table')).toMatchObject({
			rows: expect.arrayContaining([
				['A', expect.any(Array)],
				['isolated', []]
			])
		});
		const table = output.result.artifacts.find((artifact) => artifact.kind === 'table');
		if (table?.kind !== 'table') throw new Error('Expected rotation table');
		const rows = table.rows.map(
			([id, edges]) => [id as string, edges as string[]] as [string, string[]]
		);
		expect(
			Object.keys(network.nodes).length -
				Object.keys(network.edges).length +
				rotationFaceCount(network, rows)
		).toBe(3);
	});

	it('Planar Embedding retains parallel-edge and loop incidences as stored IDs', () => {
		const network = graph([
			['A', 'B'],
			['A', 'B'],
			['A', 'A']
		]);
		const output = analysisDefinitions.get('planar-embedding')!.execute(network, {});
		const table = output.result.artifacts.find((artifact) => artifact.kind === 'table');
		expect(table?.kind).toBe('table');
		if (table?.kind !== 'table') return;
		const incidences = table.rows.flatMap((row) => row[1] as string[]);
		expect(incidences.filter((id) => id === 'e0')).toHaveLength(2);
		expect(incidences.filter((id) => id === 'e1')).toHaveLength(2);
		expect(incidences.filter((id) => id === 'e2')).toHaveLength(2);
		const rows = table.rows.map(
			([id, edgeIds]) => [id as string, edgeIds as string[]] as [string, string[]]
		);
		expect(
			Object.keys(network.nodes).length -
				Object.keys(network.edges).length +
				rotationFaceCount(network, rows)
		).toBe(2);
	});
});
