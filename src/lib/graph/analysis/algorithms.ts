import { neighborsOf, reconstructPath } from '../algorithms/adjacency';
import type { GraphDocument } from '../model/types';
import type {
	AnalysisDefinition,
	AnalysisEvent,
	AnalysisInput,
	AnalysisOutput,
	InspectorOperation
} from './contracts';

function event(
	events: AnalysisEvent[],
	action: string,
	refs: Record<string, string | number | boolean>,
	roles: AnalysisEvent['roles'] = [],
	inspectors: InspectorOperation[] = []
): void {
	events.push({
		sequence: events.length,
		action,
		narration: { key: action, refs },
		roles,
		inspectors
	});
}

function node(input: AnalysisInput, id: string): string {
	return String(input[id]);
}

function runBfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const events: AnalysisEvent[] = [];
	const queue = [start];
	const discovered = new Set([start]);
	const order: string[] = [];
	const treeEdges: string[] = [];
	event(
		events,
		'enqueue',
		{ nodeId: start },
		[{ entity: 'node', id: start, role: 'frontier', operation: 'add' }],
		[
			{ inspector: 'queue', operation: 'reset', kind: 'queue', value: [] },
			{ inspector: 'visited', operation: 'reset', kind: 'ordered-list', value: [] },
			{ inspector: 'queue', operation: 'enqueue', value: start }
		]
	);
	while (queue.length) {
		const current = queue.shift()!;
		event(
			events,
			'dequeue',
			{ nodeId: current },
			[],
			[{ inspector: 'queue', operation: 'dequeue' }]
		);
		event(events, 'focus', { nodeId: current }, [
			{ entity: 'node', id: current, role: 'frontier', operation: 'remove' },
			{ entity: 'node', id: current, role: 'current', operation: 'add' }
		]);
		order.push(current);
		event(
			events,
			'visit',
			{ nodeId: current },
			[],
			[{ inspector: 'visited', operation: 'append', value: current }]
		);
		for (const neighbor of neighborsOf(snapshot, current)) {
			event(events, 'inspect', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId }, [
				{ entity: 'node', id: neighbor.nodeId, role: 'inspecting', operation: 'add' },
				{ entity: 'edge', id: neighbor.edgeId, role: 'inspecting', operation: 'add' }
			]);
			if (!discovered.has(neighbor.nodeId)) {
				discovered.add(neighbor.nodeId);
				queue.push(neighbor.nodeId);
				treeEdges.push(neighbor.edgeId);
				event(events, 'accept-tree-edge', { edgeId: neighbor.edgeId, nodeId: neighbor.nodeId }, [
					{ entity: 'edge', id: neighbor.edgeId, role: 'result', operation: 'add' }
				]);
				event(
					events,
					'enqueue',
					{ nodeId: neighbor.nodeId },
					[{ entity: 'node', id: neighbor.nodeId, role: 'frontier', operation: 'add' }],
					[{ inspector: 'queue', operation: 'enqueue', value: neighbor.nodeId }]
				);
			}
			event(events, 'inspect-complete', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId }, [
				{ entity: 'node', id: neighbor.nodeId, role: 'inspecting', operation: 'remove' },
				{ entity: 'edge', id: neighbor.edgeId, role: 'inspecting', operation: 'remove' }
			]);
		}
		event(events, 'settle', { nodeId: current }, [
			{ entity: 'node', id: current, role: 'current', operation: 'remove' },
			{ entity: 'node', id: current, role: 'settled', operation: 'add' }
		]);
	}
	return {
		result: {
			outcome: 'complete',
			summary: `Visited ${order.length} node${order.length === 1 ? '' : 's'}.`,
			metrics: [{ label: 'Visited', value: order.length }],
			artifacts: [
				{ kind: 'ordered-nodes', id: 'traversal', label: 'Traversal order', nodeIds: order },
				{ kind: 'tree', id: 'tree', label: 'BFS tree', nodeIds: order, edgeIds: treeEdges }
			]
		},
		events
	};
}

function reachableNegativeEdge(snapshot: GraphDocument, start: string): boolean {
	const queue = [start];
	const visited = new Set([start]);
	while (queue.length) {
		const current = queue.shift()!;
		for (const neighbor of neighborsOf(snapshot, current)) {
			if (neighbor.weight < 0) return true;
			if (!visited.has(neighbor.nodeId)) {
				visited.add(neighbor.nodeId);
				queue.push(neighbor.nodeId);
			}
		}
	}
	return false;
}

function runDijkstra(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const end = node(input, 'end');
	const events: AnalysisEvent[] = [];
	const distances: Record<string, number | string> = Object.fromEntries(
		Object.keys(snapshot.nodes).map((id) => [id, '∞'])
	);
	distances[start] = 0;
	const dist = new Map(Object.keys(snapshot.nodes).map((id) => [id, id === start ? 0 : Infinity]));
	const predecessors: Record<string, string> = {};
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const settled = new Set<string>();
	event(
		events,
		'enqueue',
		{ nodeId: start },
		[{ entity: 'node', id: start, role: 'frontier', operation: 'add' }],
		[
			{ inspector: 'distances', operation: 'reset', kind: 'map', value: distances },
			{ inspector: 'predecessors', operation: 'reset', kind: 'map', value: {} },
			{ inspector: 'unsettled', operation: 'reset', kind: 'set', value: [start] },
			{ inspector: 'settled', operation: 'reset', kind: 'ordered-list', value: [] }
		]
	);
	while (settled.size < Object.keys(snapshot.nodes).length) {
		let current: string | undefined;
		let best = Infinity;
		for (const [id, value] of dist) {
			if (!settled.has(id) && value < best) {
				current = id;
				best = value;
			}
		}
		if (!current) break;
		event(
			events,
			'focus',
			{ nodeId: current, distance: best },
			[
				{ entity: 'node', id: current, role: 'frontier', operation: 'remove' },
				{ entity: 'node', id: current, role: 'current', operation: 'add' }
			],
			[{ inspector: 'unsettled', operation: 'remove', value: current }]
		);
		settled.add(current);
		event(
			events,
			'settle',
			{ nodeId: current, distance: best },
			[
				{ entity: 'node', id: current, role: 'current', operation: 'remove' },
				{ entity: 'node', id: current, role: 'settled', operation: 'add' }
			],
			[{ inspector: 'settled', operation: 'append', value: current }]
		);
		if (current === end) break;
		for (const neighbor of neighborsOf(snapshot, current)) {
			if (settled.has(neighbor.nodeId)) continue;
			const candidate = best + neighbor.weight;
			event(events, 'inspect', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId, candidate }, [
				{ entity: 'node', id: neighbor.nodeId, role: 'inspecting', operation: 'add' },
				{ entity: 'edge', id: neighbor.edgeId, role: 'inspecting', operation: 'add' }
			]);
			if (candidate < (dist.get(neighbor.nodeId) ?? Infinity)) {
				dist.set(neighbor.nodeId, candidate);
				cameFrom.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
				predecessors[neighbor.nodeId] = current;
				event(
					events,
					'relax',
					{ nodeId: neighbor.nodeId, distance: candidate },
					[{ entity: 'node', id: neighbor.nodeId, role: 'frontier', operation: 'add' }],
					[
						{ inspector: 'distances', operation: 'set', key: neighbor.nodeId, value: candidate },
						{ inspector: 'predecessors', operation: 'set', key: neighbor.nodeId, value: current },
						{ inspector: 'unsettled', operation: 'add', value: neighbor.nodeId }
					]
				);
			}
			event(events, 'inspect-complete', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId }, [
				{ entity: 'node', id: neighbor.nodeId, role: 'inspecting', operation: 'remove' },
				{ entity: 'edge', id: neighbor.edgeId, role: 'inspecting', operation: 'remove' }
			]);
		}
	}
	const path = reconstructPath(cameFrom, start, end);
	if (!path || (dist.get(end) ?? Infinity) === Infinity) {
		return {
			result: {
				outcome: 'no-result',
				summary: 'No path reaches the end node.',
				metrics: [],
				artifacts: []
			},
			events
		};
	}
	for (const id of path.nodeIds)
		event(events, 'result', { nodeId: id }, [
			{ entity: 'node', id, role: 'result', operation: 'add' }
		]);
	for (const id of path.edgeIds)
		event(events, 'result', { edgeId: id }, [
			{ entity: 'edge', id, role: 'result', operation: 'add' }
		]);
	return {
		result: {
			outcome: 'complete',
			summary: `Shortest path uses ${path.edgeIds.length} edge${path.edgeIds.length === 1 ? '' : 's'}.`,
			metrics: [
				{ label: 'Length', value: path.edgeIds.length },
				{ label: 'Cost', value: dist.get(end)! }
			],
			artifacts: [{ kind: 'path', id: 'path', label: 'Shortest path', ...path }]
		},
		events
	};
}

export const bfsDefinition: AnalysisDefinition = {
	id: 'bfs',
	name: 'BFS Traversal',
	category: 'Traversal',
	description: 'Visit every node reachable from a starting node in breadth-first order.',
	fields: [{ kind: 'node', id: 'start', label: 'Start', required: true }],
	execute: runBfs
};

export const dijkstraDefinition: AnalysisDefinition = {
	id: 'dijkstra',
	name: 'Dijkstra Shortest Path',
	category: 'Shortest path',
	description: 'Find the minimum-cost path between two nodes.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'end', label: 'End', required: true }
	],
	validate: (snapshot, input) =>
		reachableNegativeEdge(snapshot, node(input, 'start'))
			? 'Dijkstra cannot run because a reachable edge has a negative weight.'
			: undefined,
	execute: runDijkstra
};

export const analysisDefinitions = new Map<string, AnalysisDefinition>([
	[bfsDefinition.id, bfsDefinition],
	[dijkstraDefinition.id, dijkstraDefinition]
]);
