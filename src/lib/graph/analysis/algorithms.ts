import { neighborsOf, reconstructPath } from '../algorithms/adjacency';
import type { GraphDocument } from '../model/types';
import type {
	AnalysisDefinition,
	AnalysisEvent,
	AnalysisInput,
	AnalysisOutput,
	AnalysisRevealStep,
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
	const search = input.mode === 'search';
	const target = search ? node(input, 'target') : undefined;
	const events: AnalysisEvent[] = [];
	const queue = [start];
	const discovered = new Set([start]);
	const order: string[] = [];
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const depths = new Map<string, number>([[start, 0]]);
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
		if (current === target) {
			event(events, 'target-found', { nodeId: current });
			event(events, 'settle', { nodeId: current }, [
				{ entity: 'node', id: current, role: 'current', operation: 'remove' },
				{ entity: 'node', id: current, role: 'settled', operation: 'add' }
			]);
			break;
		}
		for (const neighbor of neighborsOf(snapshot, current)) {
			event(events, 'inspect', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId }, [
				{ entity: 'node', id: neighbor.nodeId, role: 'inspecting', operation: 'add' },
				{ entity: 'edge', id: neighbor.edgeId, role: 'inspecting', operation: 'add' }
			]);
			if (!discovered.has(neighbor.nodeId)) {
				discovered.add(neighbor.nodeId);
				queue.push(neighbor.nodeId);
				cameFrom.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
				depths.set(neighbor.nodeId, (depths.get(current) ?? 0) + 1);
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
	const treeEdges = order
		.slice(1)
		.map((id) => cameFrom.get(id)?.edgeId)
		.filter((id): id is string => Boolean(id));
	const path = target ? reconstructPath(cameFrom, start, target) : null;
	const revealSteps: AnalysisRevealStep[] = [
		...new Set(order.map((id) => depths.get(id) ?? 0))
	].map((depth) => ({
		actions: order
			.filter((id) => (depths.get(id) ?? 0) === depth)
			.flatMap((id) => {
				const incoming = cameFrom.get(id)?.edgeId;
				return [
					...(incoming ? ([{ kind: 'reveal-edge', edgeId: incoming }] as const) : []),
					{ kind: 'reveal-node' as const, nodeId: id }
				];
			})
	}));
	if (path) revealSteps.push({ actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }] });

	if (search) {
		const artifacts: AnalysisOutput['result']['artifacts'] = [
			{ kind: 'ordered-nodes', id: 'explored', label: 'Explored nodes', nodeIds: order },
			{ kind: 'tree', id: 'tree', label: 'Exploration tree', nodeIds: order, edgeIds: treeEdges },
			...(path ? [{ kind: 'path' as const, id: 'path', label: 'Found path', ...path }] : []),
			{
				kind: 'landmarks',
				id: 'landmarks',
				label: 'Important nodes',
				entries: [
					{ nodeId: start, role: 'start' },
					{ nodeId: target!, role: 'end' }
				]
			}
		];
		return {
			result: {
				outcome: path ? 'complete' : 'no-result',
				summary: path
					? `Found a path with ${path.edgeIds.length} edges.`
					: 'Target was not reached.',
				metrics: [
					{ label: 'Visited', value: order.length },
					...(path ? [{ label: 'Length', value: path.edgeIds.length }] : [])
				],
				artifacts,
				reveal: { phases: [{ id: 'search', steps: revealSteps }] }
			},
			events
		};
	}
	return {
		result: {
			outcome: 'complete',
			summary: `Visited ${order.length} node${order.length === 1 ? '' : 's'}.`,
			metrics: [{ label: 'Visited', value: order.length }],
			artifacts: [
				{ kind: 'ordered-nodes', id: 'traversal', label: 'Traversal order', nodeIds: order },
				{ kind: 'tree', id: 'tree', label: 'BFS tree', nodeIds: order, edgeIds: treeEdges },
				{
					kind: 'landmarks',
					id: 'landmarks',
					label: 'Important nodes',
					entries: [{ nodeId: start, role: 'start' }]
				}
			]
		},
		events
	};
}

function traversalModeFields(
	extra: AnalysisDefinition['fields'] = []
): AnalysisDefinition['fields'] {
	return [
		{
			kind: 'enum',
			id: 'mode',
			label: 'Mode',
			required: true,
			defaultValue: 'traverse',
			options: [
				{ value: 'traverse', label: 'Traverse' },
				{ value: 'search', label: 'Search' }
			]
		},
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		...extra,
		{
			kind: 'node',
			id: 'target',
			label: 'Target',
			required: true,
			when: { fieldId: 'mode', equals: 'search' }
		}
	];
}

function depthFirstResult(
	name: string,
	input: AnalysisInput,
	order: string[],
	treeEdges: string[],
	path: { nodeIds: string[]; edgeIds: string[] } | null,
	events: AnalysisEvent[]
): AnalysisOutput {
	const start = node(input, 'start');
	const search = input.mode === 'search';
	const target = search ? node(input, 'target') : undefined;
	const artifacts: AnalysisOutput['result']['artifacts'] = [
		{
			kind: 'ordered-nodes',
			id: search ? 'explored' : 'traversal',
			label: search ? 'Explored nodes' : 'Traversal order',
			nodeIds: order
		},
		{ kind: 'tree', id: 'tree', label: `${name} tree`, nodeIds: order, edgeIds: treeEdges },
		...(path ? [{ kind: 'path' as const, id: 'path', label: 'Found path', ...path }] : []),
		{
			kind: 'landmarks',
			id: 'landmarks',
			label: 'Important nodes',
			entries: [
				{ nodeId: start, role: 'start' },
				...(target ? [{ nodeId: target, role: 'end' as const }] : [])
			]
		}
	];
	const revealSteps: AnalysisRevealStep[] = order.map((nodeId, index) => ({
		actions: [
			...(index > 0 && treeEdges[index - 1]
				? ([{ kind: 'reveal-edge', edgeId: treeEdges[index - 1] }] as const)
				: []),
			{ kind: 'reveal-node', nodeId }
		]
	}));
	if (path) revealSteps.push({ actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }] });
	return {
		result: {
			outcome: search && !path ? 'no-result' : 'complete',
			summary: search
				? path
					? `Found a path with ${path.edgeIds.length} edges.`
					: 'Target was not reached.'
				: `Visited ${order.length} node${order.length === 1 ? '' : 's'}.`,
			metrics: [
				{ label: 'Visited', value: order.length },
				...(path ? [{ label: 'Length', value: path.edgeIds.length }] : [])
			],
			artifacts,
			reveal: { phases: [{ id: 'search', steps: revealSteps }] }
		},
		events
	};
}

function runDfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const target = input.mode === 'search' ? node(input, 'target') : undefined;
	const events: AnalysisEvent[] = [];
	const visited = new Set<string>();
	const order: string[] = [];
	const treeEdges: string[] = [];
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	event(
		events,
		'initialize',
		{ nodeId: start },
		[],
		[
			{ inspector: 'stack', operation: 'reset', kind: 'stack', value: [] },
			{ inspector: 'visited', operation: 'reset', kind: 'ordered-list', value: [] }
		]
	);
	const visit = (current: string): boolean => {
		visited.add(current);
		order.push(current);
		event(
			events,
			'visit',
			{ nodeId: current },
			[{ entity: 'node', id: current, role: 'current', operation: 'add' }],
			[
				{ inspector: 'stack', operation: 'push', value: current },
				{ inspector: 'visited', operation: 'append', value: current }
			]
		);
		if (current === target) {
			event(events, 'target-found', { nodeId: current });
			return true;
		}
		for (const neighbor of neighborsOf(snapshot, current)) {
			event(events, 'inspect', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId });
			if (visited.has(neighbor.nodeId)) continue;
			cameFrom.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
			treeEdges.push(neighbor.edgeId);
			event(events, 'accept-tree-edge', {
				nodeId: neighbor.nodeId,
				edgeId: neighbor.edgeId
			});
			if (visit(neighbor.nodeId)) return true;
		}
		event(
			events,
			'backtrack',
			{ nodeId: current },
			[{ entity: 'node', id: current, role: 'settled', operation: 'add' }],
			[{ inspector: 'stack', operation: 'pop' }]
		);
		return false;
	};
	visit(start);
	const path = target ? reconstructPath(cameFrom, start, target) : null;
	const exploredEdges = order
		.slice(1)
		.map((id) => cameFrom.get(id)?.edgeId)
		.filter((id): id is string => Boolean(id));
	return depthFirstResult('DFS', input, order, exploredEdges, path, events);
}

function runDepthLimitedDfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const target = input.mode === 'search' ? node(input, 'target') : undefined;
	const maxDepth = Number(input.maxDepth);
	const events: AnalysisEvent[] = [];
	const uniqueOrder: string[] = [];
	const seen = new Set<string>();
	const firstIncoming = new Map<string, string>();
	let foundPath: { nodeIds: string[]; edgeIds: string[] } | null = null;
	event(
		events,
		'initialize',
		{ nodeId: start, maxDepth },
		[],
		[
			{ inspector: 'stack', operation: 'reset', kind: 'stack', value: [] },
			{ inspector: 'visited', operation: 'reset', kind: 'ordered-list', value: [] },
			{ inspector: 'depth-limit', operation: 'reset', kind: 'scalar', value: maxDepth }
		]
	);
	const visit = (current: string, pathNodes: string[], pathEdges: string[]): boolean => {
		const depth = pathEdges.length;
		if (!seen.has(current)) {
			seen.add(current);
			uniqueOrder.push(current);
			if (pathEdges.length) firstIncoming.set(current, pathEdges[pathEdges.length - 1]);
		}
		event(
			events,
			'visit',
			{ nodeId: current, depth },
			[{ entity: 'node', id: current, role: 'current', operation: 'add' }],
			[
				{ inspector: 'stack', operation: 'push', value: current },
				{ inspector: 'visited', operation: 'append', value: current }
			]
		);
		if (current === target) {
			foundPath = { nodeIds: [...pathNodes, current], edgeIds: [...pathEdges] };
			event(events, 'target-found', { nodeId: current, depth });
			return true;
		}
		const next = neighborsOf(snapshot, current).filter(
			(neighbor) => !pathNodes.includes(neighbor.nodeId) && neighbor.nodeId !== current
		);
		if (depth === maxDepth) {
			if (next.length) event(events, 'cutoff', { nodeId: current, depth, maxDepth });
			event(
				events,
				'backtrack',
				{ nodeId: current },
				[],
				[{ inspector: 'stack', operation: 'pop' }]
			);
			return false;
		}
		for (const neighbor of next) {
			event(events, 'inspect', { nodeId: neighbor.nodeId, edgeId: neighbor.edgeId, depth });
			if (visit(neighbor.nodeId, [...pathNodes, current], [...pathEdges, neighbor.edgeId]))
				return true;
		}
		event(events, 'backtrack', { nodeId: current }, [], [{ inspector: 'stack', operation: 'pop' }]);
		return false;
	};
	visit(start, [], []);
	const treeEdges = uniqueOrder
		.slice(1)
		.map((id) => firstIncoming.get(id))
		.filter((id): id is string => Boolean(id));
	return depthFirstResult('Depth-limited DFS', input, uniqueOrder, treeEdges, foundPath, events);
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
				artifacts: [
					{
						kind: 'landmarks',
						id: 'landmarks',
						label: 'Important nodes',
						entries: [
							{ nodeId: start, role: 'start' },
							{ nodeId: end, role: 'end' }
						]
					}
				]
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
			artifacts: [
				{ kind: 'path', id: 'path', label: 'Shortest path', ...path },
				{
					kind: 'landmarks',
					id: 'landmarks',
					label: 'Important nodes',
					entries: [
						{ nodeId: start, role: 'start' },
						{ nodeId: end, role: 'end' }
					]
				}
			]
		},
		events
	};
}

export const bfsDefinition: AnalysisDefinition = {
	id: 'bfs',
	name: 'Breadth-First Search',
	category: 'Traversal',
	description: 'Traverse or search a graph one breadth layer at a time.',
	fields: [
		{
			kind: 'enum',
			id: 'mode',
			label: 'Mode',
			required: true,
			defaultValue: 'traverse',
			options: [
				{ value: 'traverse', label: 'Traverse' },
				{ value: 'search', label: 'Search' }
			]
		},
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{
			kind: 'node',
			id: 'target',
			label: 'Target',
			required: true,
			when: { fieldId: 'mode', equals: 'search' }
		}
	],
	execute: runBfs
};

export const dfsDefinition: AnalysisDefinition = {
	id: 'dfs',
	name: 'Depth-First Search',
	category: 'Traversal',
	description: 'Traverse or search by following one branch as deeply as possible.',
	fields: traversalModeFields(),
	execute: runDfs
};

export const depthLimitedDfsDefinition: AnalysisDefinition = {
	id: 'depth-limited-dfs',
	name: 'Depth-Limited DFS',
	category: 'Traversal',
	description: 'Traverse or search depth-first without expanding beyond a fixed depth.',
	fields: traversalModeFields([
		{
			kind: 'number',
			id: 'maxDepth',
			label: 'Max depth',
			required: true,
			min: 0,
			integer: true
		}
	]),
	execute: runDepthLimitedDfs
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
	[dfsDefinition.id, dfsDefinition],
	[depthLimitedDfsDefinition.id, depthLimitedDfsDefinition],
	[dijkstraDefinition.id, dijkstraDefinition]
]);
