import { euclidean3d, neighborsOf, reconstructPath } from '../algorithms/adjacency';
import type { GraphDocument, GraphEdge } from '../model/types';
import type {
	AnalysisDefinition,
	AnalysisEvent,
	AnalysisInput,
	AnalysisOutput,
	AnalysisRevealStep,
	InspectorOperation
} from './contracts';
import { leftRightPlanarity } from './planarity';

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

const TRACE_EVENT_LIMIT = 50_000;

function boundedEvent(
	events: AnalysisEvent[],
	action: string,
	refs: Record<string, string | number | boolean>,
	roles: AnalysisEvent['roles'] = [],
	inspectors: InspectorOperation[] = []
): void {
	if (events.length < TRACE_EVENT_LIMIT) event(events, action, refs, roles, inspectors);
}

function node(input: AnalysisInput, id: string): string {
	return String(input[id]);
}

function appendPathReplay(
	steps: AnalysisRevealStep[],
	path: { nodeIds: string[]; edgeIds: string[] }
): void {
	const [start, ...remainingNodes] = path.nodeIds;
	if (start) steps.push({ actions: [{ kind: 'emphasize-node', nodeId: start }] });
	path.edgeIds.forEach((edgeId, index) => {
		const nodeId = remainingNodes[index];
		steps.push({
			actions: [
				{ kind: 'emphasize-edge', edgeId },
				...(nodeId ? [{ kind: 'emphasize-node' as const, nodeId }] : [])
			]
		});
	});
}

function oneObjectRevealSteps(steps: AnalysisRevealStep[]): AnalysisRevealStep[] {
	return steps.flatMap((step) => {
		const resets = step.actions.filter((action) => action.kind === 'reset-footprint');
		const visualActions = step.actions.filter((action) => action.kind !== 'reset-footprint');
		if (!visualActions.length) return [{ actions: resets }];
		return visualActions.map((action, index) => ({
			actions: [...(index === 0 ? resets : []), action]
		}));
	});
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
	].flatMap((depth) =>
		order
			.filter((id) => (depths.get(id) ?? 0) === depth)
			.flatMap((id) => {
				const incoming = cameFrom.get(id)?.edgeId;
				return [
					...(incoming ? ([{ kind: 'reveal-edge', edgeId: incoming }] as const) : []),
					{ kind: 'reveal-node' as const, nodeId: id }
				].map((action) => ({ actions: [action] }));
			})
	);
	if (path) appendPathReplay(revealSteps, path);

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
				reveal: { phases: [{ id: 'search', steps: oneObjectRevealSteps(revealSteps) }] }
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
			],
			reveal: { phases: [{ id: 'traversal', steps: oneObjectRevealSteps(revealSteps) }] }
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
	if (path) appendPathReplay(revealSteps, path);
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
			reveal: { phases: [{ id: 'search', steps: oneObjectRevealSteps(revealSteps) }] }
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

function runIddfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const phases: NonNullable<AnalysisOutput['result']['reveal']>['phases'] = [];
	const events: AnalysisEvent[] = [];
	const reachable = new Set([node(input, 'start')]);
	const reachableQueue = [...reachable];
	while (reachableQueue.length) {
		const current = reachableQueue.shift()!;
		for (const neighbor of neighborsOf(snapshot, current)) {
			if (reachable.has(neighbor.nodeId)) continue;
			reachable.add(neighbor.nodeId);
			reachableQueue.push(neighbor.nodeId);
		}
	}
	const maximumSimpleDepth = Math.max(0, Object.keys(snapshot.nodes).length - 1);
	let finalOutput: AnalysisOutput | null = null;
	let finalDepth = 0;
	for (let depth = 0; depth <= maximumSimpleDepth; depth += 1) {
		if (depth > 0) event(events, 'restart-depth', { depth });
		const iteration = runDepthLimitedDfs(snapshot, { ...input, maxDepth: depth });
		for (const item of iteration.events) events.push({ ...item, sequence: events.length });
		const iterationSteps = iteration.result.reveal?.phases[0]?.steps ?? [];
		const [firstIterationStep, ...remainingIterationSteps] = iterationSteps;
		phases.push({
			id: `depth-${depth}`,
			steps:
				depth > 0 && firstIterationStep
					? [
							{
								actions: [{ kind: 'reset-footprint' as const }, ...firstIterationStep.actions]
							},
							...remainingIterationSteps
						]
					: iterationSteps
		});
		finalOutput = iteration;
		finalDepth = depth;
		const found = iteration.result.outcome === 'complete' && input.mode === 'search';
		const cutOff = iteration.events.some((item) => item.action === 'cutoff');
		const visitedArtifact = iteration.result.artifacts.find(
			(artifact) => artifact.kind === 'ordered-nodes'
		);
		const exploredAllReachable =
			visitedArtifact?.kind === 'ordered-nodes' &&
			new Set(visitedArtifact.nodeIds).size === reachable.size;
		if (found || exploredAllReachable || !cutOff) break;
	}
	if (!finalOutput) throw new Error('IDDFS requires a valid start node.');
	const depthMetric = {
		label:
			input.mode === 'search' && finalOutput.result.outcome === 'complete'
				? 'Found depth'
				: 'Explored depth',
		value: finalDepth
	};
	return {
		result: {
			...finalOutput.result,
			metrics: [depthMetric, ...finalOutput.result.metrics],
			reveal: {
				phases: phases.map((phase) => ({
					...phase,
					steps: oneObjectRevealSteps(phase.steps)
				}))
			}
		},
		events
	};
}

function randomSeed(): number {
	if (typeof globalThis.crypto?.getRandomValues === 'function') {
		return globalThis.crypto.getRandomValues(new Uint32Array(1))[0];
	}
	return Math.floor(Math.random() * 0x1_0000_0000) >>> 0;
}

function seededRandom(seed: number): () => number {
	let state = seed >>> 0;
	return () => {
		state = (state + 0x6d2b79f5) | 0;
		let value = Math.imul(state ^ (state >>> 15), 1 | state);
		value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
		return ((value ^ (value >>> 14)) >>> 0) / 0x1_0000_0000;
	};
}

function reachableNodes(snapshot: GraphDocument, start: string): Set<string> {
	const reachable = new Set([start]);
	const queue = [start];
	while (queue.length) {
		const current = queue.shift()!;
		for (const neighbor of neighborsOf(snapshot, current)) {
			if (reachable.has(neighbor.nodeId)) continue;
			reachable.add(neighbor.nodeId);
			queue.push(neighbor.nodeId);
		}
	}
	return reachable;
}

function runRandomWalk(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const search = input.mode === 'search';
	const target = search ? node(input, 'target') : undefined;
	const maxSteps = Number(input.maxSteps ?? 100);
	const seed = input.seed === undefined ? randomSeed() : Number(input.seed) >>> 0;
	const random = seededRandom(seed);
	const events: AnalysisEvent[] = [];
	const nodeIds = [start];
	const edgeIds: string[] = [];
	const visitCounts = new Map<string, number>([[start, 1]]);
	const revealSteps: AnalysisRevealStep[] = [
		{ actions: [{ kind: 'reveal-node', nodeId: start, role: 'start' }] }
	];
	const reachable = reachableNodes(snapshot, start);
	event(
		events,
		'initialize-walk',
		{ nodeId: start, seed, maxSteps },
		[],
		[
			{ inspector: 'current-node', operation: 'reset', kind: 'scalar', value: start },
			{ inspector: 'step', operation: 'reset', kind: 'scalar', value: 0 },
			{ inspector: 'visit-history', operation: 'reset', kind: 'ordered-list', value: [start] },
			{ inspector: 'visit-counts', operation: 'reset', kind: 'map', value: { [start]: 1 } }
		]
	);
	let current = start;
	let found = current === target;
	let termination: 'target-found' | 'coverage-complete' | 'dead-end' | 'max-steps' | null = found
		? 'target-found'
		: visitCounts.size === reachable.size
			? 'coverage-complete'
			: null;
	if (termination) event(events, termination, { nodeId: current, step: 0 });
	for (let step = 1; step <= maxSteps && !termination; step += 1) {
		const neighbors = neighborsOf(snapshot, current);
		if (!neighbors.length) {
			event(events, 'dead-end', { nodeId: current, step: step - 1 });
			termination = 'dead-end';
			break;
		}
		const chosen = neighbors[Math.floor(random() * neighbors.length)];
		current = chosen.nodeId;
		nodeIds.push(current);
		edgeIds.push(chosen.edgeId);
		const visitNumber = (visitCounts.get(current) ?? 0) + 1;
		const revisit = visitNumber > 1;
		visitCounts.set(current, visitNumber);
		revealSteps.push({
			actions: [
				{ kind: 'reveal-edge', edgeId: chosen.edgeId, role: 'walk' },
				...(revisit
					? [{ kind: 'revisit-node' as const, nodeId: current, viaEdgeId: chosen.edgeId }]
					: [{ kind: 'reveal-node' as const, nodeId: current, role: 'walk' }])
			]
		});
		event(
			events,
			revisit ? 'revisit' : 'walk-step',
			{ nodeId: current, edgeId: chosen.edgeId, step, visitNumber },
			[{ entity: 'node', id: current, role: 'current', operation: 'add' }],
			[
				{ inspector: 'current-node', operation: 'set', value: current },
				{ inspector: 'step', operation: 'set', value: step },
				{ inspector: 'visit-history', operation: 'append', value: current },
				{ inspector: 'visit-counts', operation: 'set', key: current, value: visitNumber }
			]
		);
		found = current === target;
		if (found) {
			termination = 'target-found';
			event(events, termination, { nodeId: current, step });
		} else if (visitCounts.size === reachable.size) {
			termination = 'coverage-complete';
			event(events, termination, { nodeId: current, step });
		}
	}
	if (!termination) {
		termination = 'max-steps';
		event(events, termination, { nodeId: current, step: edgeIds.length });
	}
	const walkArtifact = {
		kind: 'path' as const,
		id: 'walk',
		label: search && found ? 'Found walk' : 'Walk',
		nodeIds,
		edgeIds
	};
	if (search && found) {
		appendPathReplay(revealSteps, walkArtifact);
	}
	return {
		effectiveInput: { ...input, maxSteps, seed },
		result: {
			outcome: search && !found ? 'no-result' : 'complete',
			summary: search
				? found
					? `Reached the target in ${edgeIds.length} steps.`
					: `Did not reach the target within ${maxSteps} steps.`
				: `Walked ${edgeIds.length} steps.`,
			metrics: [
				{ label: 'Steps taken', value: edgeIds.length },
				{ label: 'Unique nodes', value: visitCounts.size },
				{ label: 'Seed', value: seed },
				...(search ? [{ label: 'Target found', value: found ? 'Yes' : 'No' }] : [])
			],
			artifacts: [
				{
					kind: 'ordered-nodes',
					id: 'walk-order',
					label: 'Walk order',
					nodeIds
				},
				walkArtifact,
				{
					kind: 'landmarks',
					id: 'landmarks',
					label: 'Important nodes',
					entries: [
						{ nodeId: start, role: 'start' },
						...(target ? [{ nodeId: target, role: 'end' as const }] : [])
					]
				}
			],
			reveal: { phases: [{ id: 'walk', steps: oneObjectRevealSteps(revealSteps) }] }
		},
		events
	};
}

function runMultiSourceBfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const starts = [...new Set((input.starts as string[]) ?? [])];
	const search = input.mode === 'search';
	const target = search ? node(input, 'target') : undefined;
	const events: AnalysisEvent[] = [];
	const queue = [...starts];
	const discovered = new Set(starts);
	const owner = new Map(starts.map((id) => [id, id]));
	const depths = new Map(starts.map((id) => [id, 0]));
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const order: string[] = [];
	event(
		events,
		'initialize-sources',
		{ sourceCount: starts.length },
		[],
		[
			{ inspector: 'queue', operation: 'reset', kind: 'queue', value: starts },
			{ inspector: 'visited', operation: 'reset', kind: 'ordered-list', value: [] },
			{
				inspector: 'source-ownership',
				operation: 'reset',
				kind: 'map',
				value: Object.fromEntries(starts.map((id) => [id, id]))
			}
		]
	);
	while (queue.length) {
		const current = queue.shift()!;
		order.push(current);
		event(
			events,
			'visit',
			{ nodeId: current, depth: depths.get(current) ?? 0 },
			[{ entity: 'node', id: current, role: 'current', operation: 'add' }],
			[
				{ inspector: 'queue', operation: 'dequeue' },
				{ inspector: 'visited', operation: 'append', value: current }
			]
		);
		if (current === target) {
			event(events, 'target-found', { nodeId: current, sourceId: owner.get(current) ?? current });
			break;
		}
		for (const neighbor of neighborsOf(snapshot, current)) {
			if (discovered.has(neighbor.nodeId)) continue;
			discovered.add(neighbor.nodeId);
			queue.push(neighbor.nodeId);
			cameFrom.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
			owner.set(neighbor.nodeId, owner.get(current) ?? current);
			depths.set(neighbor.nodeId, (depths.get(current) ?? 0) + 1);
			event(
				events,
				'enqueue',
				{
					nodeId: neighbor.nodeId,
					edgeId: neighbor.edgeId,
					sourceId: owner.get(neighbor.nodeId)!
				},
				[{ entity: 'node', id: neighbor.nodeId, role: 'frontier', operation: 'add' }],
				[
					{ inspector: 'queue', operation: 'enqueue', value: neighbor.nodeId },
					{
						inspector: 'source-ownership',
						operation: 'set',
						key: neighbor.nodeId,
						value: owner.get(neighbor.nodeId)!
					}
				]
			);
		}
	}
	const winningStart = target ? owner.get(target) : undefined;
	const path = target && winningStart ? reconstructPath(cameFrom, winningStart, target) : null;
	const treeEdges = order
		.filter((id) => !starts.includes(id))
		.map((id) => cameFrom.get(id)?.edgeId)
		.filter((id): id is string => Boolean(id));
	const steps: AnalysisRevealStep[] = [...new Set(order.map((id) => depths.get(id) ?? 0))].map(
		(depth) => ({
			actions: order
				.filter((id) => (depths.get(id) ?? 0) === depth)
				.flatMap((id) => {
					const incoming = cameFrom.get(id)?.edgeId;
					return [
						...(incoming
							? ([{ kind: 'reveal-edge', edgeId: incoming, role: 'frontier' }] as const)
							: []),
						{
							kind: 'reveal-node' as const,
							nodeId: id,
							role: depth === 0 ? 'source' : 'frontier'
						}
					];
				})
		})
	);
	if (path) appendPathReplay(steps, path);
	const artifacts: AnalysisOutput['result']['artifacts'] = [
		{
			kind: 'ordered-nodes',
			id: search ? 'explored' : 'traversal',
			label: search ? 'Explored nodes' : 'Traversal order',
			nodeIds: order
		},
		{ kind: 'tree', id: 'forest', label: 'BFS forest', nodeIds: order, edgeIds: treeEdges },
		...(path ? [{ kind: 'path' as const, id: 'path', label: 'Found path', ...path }] : []),
		{
			kind: 'landmarks',
			id: 'landmarks',
			label: 'Important nodes',
			entries: [
				...starts.map((nodeId) => ({ nodeId, role: 'start' as const })),
				...(target ? [{ nodeId: target, role: 'end' as const }] : [])
			]
		}
	];
	return {
		result: {
			outcome: search && !path ? 'no-result' : 'complete',
			summary: search
				? path
					? `Source ${winningStart} reached the target in ${path.edgeIds.length} edges.`
					: 'No source reached the target.'
				: `Visited ${order.length} nodes from ${starts.length} sources.`,
			metrics: [
				{ label: 'Sources', value: starts.length },
				{ label: 'Visited', value: order.length },
				{ label: 'Maximum depth', value: Math.max(0, ...order.map((id) => depths.get(id) ?? 0)) },
				...(path ? [{ label: 'Length', value: path.edgeIds.length }] : [])
			],
			artifacts,
			reveal: { phases: [{ id: 'combined', steps: oneObjectRevealSteps(steps) }] }
		},
		events
	};
}

function incomingNeighborsOf(snapshot: GraphDocument, nodeId: string) {
	return Object.values(snapshot.edges).flatMap((edge) => {
		if (edge.to === nodeId)
			return [{ nodeId: edge.from, edgeId: edge.id, weight: edge.weight, edge }];
		if (!edge.directed && edge.from === nodeId)
			return [{ nodeId: edge.to, edgeId: edge.id, weight: edge.weight, edge }];
		return [];
	});
}

function runBidirectionalBfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const target = node(input, 'target');
	const events: AnalysisEvent[] = [];
	const startDepth = new Map<string, number>([[start, 0]]);
	const targetDepth = new Map<string, number>([[target, 0]]);
	const startParent = new Map<string, { prev: string; edgeId: string }>();
	const targetParent = new Map<string, { next: string; edgeId: string }>();
	let startFrontier = [start];
	let targetFrontier = [target];
	const traversedNodes = new Set([start, target]);
	const traversalOrder = start === target ? [start] : [start, target];
	let meeting: string | undefined = start === target ? start : undefined;
	const steps: AnalysisRevealStep[] = [
		{
			actions: [
				{ kind: 'reveal-node', nodeId: start, role: 'start-side' },
				{ kind: 'reveal-node', nodeId: target, role: 'target-side' }
			]
		}
	];
	event(
		events,
		'initialize-frontiers',
		{ start, target },
		[],
		[
			{ inspector: 'start-queue', operation: 'reset', kind: 'queue', value: [start] },
			{ inspector: 'target-queue', operation: 'reset', kind: 'queue', value: [target] },
			{ inspector: 'start-visited', operation: 'reset', kind: 'set', value: [start] },
			{ inspector: 'target-visited', operation: 'reset', kind: 'set', value: [target] },
			{ inspector: 'start-predecessors', operation: 'reset', kind: 'map', value: {} },
			{ inspector: 'target-predecessors', operation: 'reset', kind: 'map', value: {} },
			{ inspector: 'meeting-candidates', operation: 'reset', kind: 'ordered-list', value: [] }
		]
	);
	let initialWave = true;
	while (!meeting && startFrontier.length && targetFrontier.length) {
		const nextStart: string[] = [];
		const nextTarget: string[] = [];
		if (!initialWave) {
			const waveActions: AnalysisRevealStep['actions'] = [];
			for (const nodeId of startFrontier) {
				const incoming = startParent.get(nodeId)?.edgeId;
				if (incoming) waveActions.push({ kind: 'reveal-edge', edgeId: incoming });
				waveActions.push({ kind: 'reveal-node', nodeId, role: 'start-side' });
				if (!traversedNodes.has(nodeId)) {
					traversedNodes.add(nodeId);
					traversalOrder.push(nodeId);
				}
			}
			for (const nodeId of targetFrontier) {
				const incoming = targetParent.get(nodeId)?.edgeId;
				if (incoming) waveActions.push({ kind: 'reveal-edge', edgeId: incoming });
				waveActions.push({ kind: 'reveal-node', nodeId, role: 'target-side' });
				if (!traversedNodes.has(nodeId)) {
					traversedNodes.add(nodeId);
					traversalOrder.push(nodeId);
				}
			}
			if (waveActions.length) steps.push({ actions: waveActions });
		}
		for (const current of startFrontier) {
			event(
				events,
				'expand-start-frontier',
				{ nodeId: current },
				[],
				[
					{ inspector: 'start-queue', operation: 'dequeue' },
					{ inspector: 'start-visited', operation: 'add', value: current },
					{ inspector: 'frontier-side', operation: 'set', value: 'Start' }
				]
			);
			for (const neighbor of neighborsOf(snapshot, current)) {
				if (startDepth.has(neighbor.nodeId)) continue;
				startDepth.set(neighbor.nodeId, (startDepth.get(current) ?? 0) + 1);
				startParent.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
				nextStart.push(neighbor.nodeId);
				event(
					events,
					'discover-start-side',
					{ nodeId: neighbor.nodeId, edgeId: neighbor.edgeId },
					[],
					[
						{ inspector: 'start-queue', operation: 'enqueue', value: neighbor.nodeId },
						{
							inspector: 'start-predecessors',
							operation: 'set',
							key: neighbor.nodeId,
							value: current
						}
					]
				);
			}
		}
		for (const current of targetFrontier) {
			event(
				events,
				'expand-target-frontier',
				{ nodeId: current },
				[],
				[
					{ inspector: 'target-queue', operation: 'dequeue' },
					{ inspector: 'target-visited', operation: 'add', value: current },
					{ inspector: 'frontier-side', operation: 'set', value: 'Target' }
				]
			);
			for (const neighbor of incomingNeighborsOf(snapshot, current)) {
				if (targetDepth.has(neighbor.nodeId)) continue;
				targetDepth.set(neighbor.nodeId, (targetDepth.get(current) ?? 0) + 1);
				targetParent.set(neighbor.nodeId, { next: current, edgeId: neighbor.edgeId });
				nextTarget.push(neighbor.nodeId);
				event(
					events,
					'discover-target-side',
					{ nodeId: neighbor.nodeId, edgeId: neighbor.edgeId },
					[],
					[
						{ inspector: 'target-queue', operation: 'enqueue', value: neighbor.nodeId },
						{
							inspector: 'target-predecessors',
							operation: 'set',
							key: neighbor.nodeId,
							value: current
						}
					]
				);
			}
		}
		const candidates = [...startDepth.keys()].filter((id) => targetDepth.has(id));
		candidates.sort(
			(a, b) =>
				startDepth.get(a)! + targetDepth.get(a)! - (startDepth.get(b)! + targetDepth.get(b)!) ||
				[...startDepth.keys()].indexOf(a) - [...startDepth.keys()].indexOf(b)
		);
		meeting = candidates[0];
		event(
			events,
			'meeting-candidates',
			{ count: candidates.length },
			[],
			[
				{
					inspector: 'meeting-candidates',
					operation: 'reset',
					kind: 'ordered-list',
					value: candidates
				}
			]
		);
		if (meeting && !traversedNodes.has(meeting)) {
			const meetingActions: AnalysisRevealStep['actions'] = [];
			const startEdge = startParent.get(meeting)?.edgeId;
			const targetEdge = targetParent.get(meeting)?.edgeId;
			if (startEdge) meetingActions.push({ kind: 'reveal-edge', edgeId: startEdge });
			if (targetEdge && targetEdge !== startEdge)
				meetingActions.push({ kind: 'reveal-edge', edgeId: targetEdge });
			meetingActions.push({ kind: 'reveal-node', nodeId: meeting, role: 'start-side' });
			steps.push({ actions: meetingActions });
			traversedNodes.add(meeting);
			traversalOrder.push(meeting);
		}
		startFrontier = nextStart;
		targetFrontier = nextTarget;
		initialWave = false;
	}
	let path: { nodeIds: string[]; edgeIds: string[] } | null = null;
	if (meeting) {
		const left = reconstructPath(startParent, start, meeting)!;
		const nodeIds = [...left.nodeIds];
		const edgeIds = [...left.edgeIds];
		let current = meeting;
		while (current !== target) {
			const next = targetParent.get(current);
			if (!next) break;
			edgeIds.push(next.edgeId);
			nodeIds.push(next.next);
			current = next.next;
		}
		if (current === target) path = { nodeIds, edgeIds };
	}
	if (path) {
		appendPathReplay(steps, path);
		event(
			events,
			'frontiers-meet',
			{ nodeId: meeting! },
			[],
			[
				{ inspector: 'meeting-point', operation: 'set', value: meeting! },
				{ inspector: 'start-visited', operation: 'add', value: meeting! },
				{ inspector: 'target-visited', operation: 'add', value: meeting! }
			]
		);
	}
	const exploredNodes = traversalOrder;
	const exploredEdges = [
		...new Set(
			exploredNodes.flatMap((nodeId) => [
				...(startParent.get(nodeId) ? [startParent.get(nodeId)!.edgeId] : []),
				...(targetParent.get(nodeId) ? [targetParent.get(nodeId)!.edgeId] : [])
			])
		)
	];
	return {
		result: {
			outcome: path ? 'complete' : 'no-result',
			summary: path
				? `Frontiers found a path with ${path.edgeIds.length} edges.`
				: 'The frontiers did not meet.',
			metrics: [
				{ label: 'Visited', value: exploredNodes.length },
				...(path ? [{ label: 'Length', value: path.edgeIds.length }] : [])
			],
			artifacts: [
				{
					kind: 'ordered-nodes',
					id: 'explored',
					label: 'Explored nodes',
					nodeIds: exploredNodes
				},
				{
					kind: 'tree',
					id: 'frontiers',
					label: 'Search frontiers',
					nodeIds: exploredNodes,
					edgeIds: [...new Set(exploredEdges)]
				},
				...(path ? [{ kind: 'path' as const, id: 'path', label: 'Found path', ...path }] : []),
				{
					kind: 'landmarks',
					id: 'landmarks',
					label: 'Important nodes',
					entries: [
						{ nodeId: start, role: 'start' },
						{ nodeId: target, role: 'end' }
					]
				}
			],
			reveal: { phases: [{ id: 'bidirectional', steps: oneObjectRevealSteps(steps) }] }
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

function shortestPathOutput(
	snapshot: GraphDocument,
	start: string,
	end: string,
	name: string,
	dist: Map<string, number>,
	cameFrom: Map<string, { prev: string; edgeId: string }>,
	explored: string[],
	events: AnalysisEvent[],
	extraMetrics: AnalysisOutput['result']['metrics'] = []
): AnalysisOutput {
	const path = reconstructPath(cameFrom, start, end);
	const treeEdges = explored
		.map((id) => cameFrom.get(id)?.edgeId)
		.filter((id): id is string => Boolean(id));
	const steps: AnalysisRevealStep[] = explored.flatMap((id) => [
		...(cameFrom.get(id)
			? [{ actions: [{ kind: 'reveal-edge' as const, edgeId: cameFrom.get(id)!.edgeId }] }]
			: []),
		{ actions: [{ kind: 'reveal-node' as const, nodeId: id }] }
	]);
	if (path) appendPathReplay(steps, path);
	const landmarks = {
		kind: 'landmarks' as const,
		id: 'landmarks',
		label: 'Important nodes',
		entries: [
			{ nodeId: start, role: 'start' as const },
			{ nodeId: end, role: 'end' as const }
		]
	};
	if (!path || !Number.isFinite(dist.get(end) ?? Infinity)) {
		return {
			result: {
				outcome: 'no-result',
				summary: 'No path reaches the end node.',
				metrics: [{ label: 'Explored', value: explored.length }, ...extraMetrics],
				artifacts: [
					{ kind: 'ordered-nodes', id: 'explored', label: 'Explored nodes', nodeIds: explored },
					{
						kind: 'tree',
						id: 'tree',
						label: 'Exploration tree',
						nodeIds: explored,
						edgeIds: treeEdges
					},
					landmarks
				],
				reveal: { phases: [{ id: 'search', steps: oneObjectRevealSteps(steps) }] }
			},
			events
		};
	}
	return {
		result: {
			outcome: 'complete',
			summary: `${name} found a path with ${path.edgeIds.length} edge${path.edgeIds.length === 1 ? '' : 's'}.`,
			metrics: [
				{ label: 'Length', value: path.edgeIds.length },
				{ label: 'Cost', value: dist.get(end)! },
				{ label: 'Explored', value: explored.length },
				...extraMetrics
			],
			artifacts: [
				{ kind: 'ordered-nodes', id: 'explored', label: 'Explored nodes', nodeIds: explored },
				{
					kind: 'tree',
					id: 'tree',
					label: 'Exploration tree',
					nodeIds: explored,
					edgeIds: treeEdges
				},
				{ kind: 'path', id: 'path', label: 'Shortest path', ...path },
				landmarks
			],
			reveal: { phases: [{ id: 'search', steps: oneObjectRevealSteps(steps) }] }
		},
		events
	};
}

function ineligibleShortestPath(start: string, end: string, summary: string): AnalysisOutput {
	return {
		result: {
			outcome: 'no-result',
			summary,
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
		events: []
	};
}

function runZeroOneBfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const end = node(input, 'end');
	if (Object.values(snapshot.edges).some((edge) => edge.weight !== 0 && edge.weight !== 1))
		return ineligibleShortestPath(start, end, '0–1 BFS requires every edge to have weight 0 or 1.');
	const dist = new Map(Object.keys(snapshot.nodes).map((id) => [id, id === start ? 0 : Infinity]));
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const deque = [start];
	const explored: string[] = [];
	const events: AnalysisEvent[] = [];
	while (deque.length) {
		const current = deque.shift()!;
		explored.push(current);
		event(
			events,
			'dequeue',
			{ nodeId: current },
			[],
			[{ inspector: 'deque', operation: 'dequeue' }]
		);
		for (const neighbor of neighborsOf(snapshot, current)) {
			const candidate = dist.get(current)! + neighbor.weight;
			if (candidate < dist.get(neighbor.nodeId)!) {
				dist.set(neighbor.nodeId, candidate);
				cameFrom.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
				if (neighbor.weight === 0) deque.unshift(neighbor.nodeId);
				else deque.push(neighbor.nodeId);
				event(
					events,
					'relax',
					{ nodeId: neighbor.nodeId, edgeId: neighbor.edgeId, distance: candidate },
					[],
					[{ inspector: 'distances', operation: 'set', key: neighbor.nodeId, value: candidate }]
				);
			}
		}
	}
	return shortestPathOutput(
		snapshot,
		start,
		end,
		'0–1 BFS',
		dist,
		cameFrom,
		[...new Set(explored)],
		events
	);
}

function allArcs(
	snapshot: GraphDocument
): Array<{ from: string; to: string; edgeId: string; weight: number }> {
	return Object.values(snapshot.edges).flatMap((edge) => [
		{ from: edge.from, to: edge.to, edgeId: edge.id, weight: edge.weight },
		...(!edge.directed
			? [{ from: edge.to, to: edge.from, edgeId: edge.id, weight: edge.weight }]
			: [])
	]);
}

function runBellmanFord(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const end = node(input, 'end');
	const arcs = allArcs(snapshot);
	const dist = new Map(Object.keys(snapshot.nodes).map((id) => [id, id === start ? 0 : Infinity]));
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const events: AnalysisEvent[] = [];
	let rounds = 0;
	for (; rounds < Math.max(0, Object.keys(snapshot.nodes).length - 1); rounds++) {
		let changed = false;
		for (const arc of arcs)
			if (
				Number.isFinite(dist.get(arc.from)!) &&
				dist.get(arc.from)! + arc.weight < dist.get(arc.to)!
			) {
				dist.set(arc.to, dist.get(arc.from)! + arc.weight);
				cameFrom.set(arc.to, { prev: arc.from, edgeId: arc.edgeId });
				changed = true;
				event(
					events,
					'relax',
					{ nodeId: arc.to, edgeId: arc.edgeId, round: rounds + 1 },
					[],
					[{ inspector: 'distances', operation: 'set', key: arc.to, value: dist.get(arc.to)! }]
				);
			}
		if (!changed) {
			rounds++;
			break;
		}
	}
	const affected = new Set(
		arcs
			.filter(
				(arc) =>
					Number.isFinite(dist.get(arc.from)!) &&
					dist.get(arc.from)! + arc.weight < dist.get(arc.to)!
			)
			.map((arc) => arc.to)
	);
	const reachesTarget = (from: string) => {
		const seen = new Set([from]);
		const queue = [from];
		while (queue.length) {
			const current = queue.shift()!;
			if (current === end) return true;
			for (const n of neighborsOf(snapshot, current))
				if (!seen.has(n.nodeId)) {
					seen.add(n.nodeId);
					queue.push(n.nodeId);
				}
		}
		return false;
	};
	if ([...affected].some(reachesTarget))
		return ineligibleShortestPath(
			start,
			end,
			'Shortest path is undefined due to a reachable negative cycle.'
		);
	return shortestPathOutput(
		snapshot,
		start,
		end,
		'Bellman–Ford',
		dist,
		cameFrom,
		Object.keys(snapshot.nodes).filter((id) => Number.isFinite(dist.get(id)!)),
		events,
		[{ label: 'Rounds', value: rounds }]
	);
}

function runDagShortestPath(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const end = node(input, 'end');
	if (Object.values(snapshot.edges).some((edge) => !edge.directed))
		return ineligibleShortestPath(
			start,
			end,
			'DAG shortest path requires every edge to be directed.'
		);
	const inDegree = new Map(Object.keys(snapshot.nodes).map((id) => [id, 0]));
	for (const edge of Object.values(snapshot.edges))
		inDegree.set(edge.to, inDegree.get(edge.to)! + 1);
	const queue = Object.keys(snapshot.nodes).filter((id) => inDegree.get(id) === 0);
	const order: string[] = [];
	while (queue.length) {
		const current = queue.shift()!;
		order.push(current);
		for (const n of neighborsOf(snapshot, current)) {
			inDegree.set(n.nodeId, inDegree.get(n.nodeId)! - 1);
			if (inDegree.get(n.nodeId) === 0) queue.push(n.nodeId);
		}
	}
	if (order.length !== Object.keys(snapshot.nodes).length)
		return ineligibleShortestPath(
			start,
			end,
			'DAG shortest path requires an acyclic directed graph.'
		);
	const dist = new Map(Object.keys(snapshot.nodes).map((id) => [id, id === start ? 0 : Infinity]));
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const events: AnalysisEvent[] = [];
	for (const current of order)
		if (Number.isFinite(dist.get(current)!))
			for (const n of neighborsOf(snapshot, current))
				if (dist.get(current)! + n.weight < dist.get(n.nodeId)!) {
					dist.set(n.nodeId, dist.get(current)! + n.weight);
					cameFrom.set(n.nodeId, { prev: current, edgeId: n.edgeId });
					event(
						events,
						'relax',
						{ nodeId: n.nodeId, edgeId: n.edgeId },
						[],
						[
							{
								inspector: 'distances',
								operation: 'set',
								key: n.nodeId,
								value: dist.get(n.nodeId)!
							}
						]
					);
				}
	return shortestPathOutput(
		snapshot,
		start,
		end,
		'DAG shortest path',
		dist,
		cameFrom,
		order.filter((id) => Number.isFinite(dist.get(id)!)),
		events,
		[{ label: 'Topological nodes', value: order.length }]
	);
}

function hasReachableNegativeEdge(snapshot: GraphDocument, start: string): boolean {
	return reachableNegativeEdge(snapshot, start);
}

function safeHeuristicScale(snapshot: GraphDocument): number {
	let scale = Infinity;
	for (const edge of Object.values(snapshot.edges)) {
		if (edge.weight < 0 || !Number.isFinite(edge.weight)) continue;
		const length = euclidean3d(
			snapshot.nodes[edge.from].position,
			snapshot.nodes[edge.to].position
		);
		if (length > 0) scale = Math.min(scale, edge.weight / length);
	}
	return Number.isFinite(scale) ? scale : 0;
}

function runAStar(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const end = node(input, 'end');
	if (hasReachableNegativeEdge(snapshot, start))
		return ineligibleShortestPath(start, end, 'A* requires non-negative reachable edge weights.');
	const scale = safeHeuristicScale(snapshot);
	const h = (id: string) =>
		scale * euclidean3d(snapshot.nodes[id].position, snapshot.nodes[end].position);
	const dist = new Map(Object.keys(snapshot.nodes).map((id) => [id, id === start ? 0 : Infinity]));
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const open = new Set([start]);
	const settled = new Set<string>();
	const explored: string[] = [];
	const events: AnalysisEvent[] = [];
	while (open.size) {
		const current = [...open].sort((a, b) => dist.get(a)! + h(a) - (dist.get(b)! + h(b)))[0];
		open.delete(current);
		if (settled.has(current)) continue;
		settled.add(current);
		explored.push(current);
		if (current === end) break;
		for (const n of neighborsOf(snapshot, current)) {
			const candidate = dist.get(current)! + n.weight;
			if (candidate < dist.get(n.nodeId)!) {
				dist.set(n.nodeId, candidate);
				cameFrom.set(n.nodeId, { prev: current, edgeId: n.edgeId });
				open.add(n.nodeId);
				event(
					events,
					'relax',
					{ nodeId: n.nodeId, edgeId: n.edgeId, score: candidate + h(n.nodeId) },
					[],
					[
						{ inspector: 'g-scores', operation: 'set', key: n.nodeId, value: candidate },
						{
							inspector: 'f-scores',
							operation: 'set',
							key: n.nodeId,
							value: candidate + h(n.nodeId)
						}
					]
				);
			}
		}
	}
	return shortestPathOutput(snapshot, start, end, 'A*', dist, cameFrom, explored, events, [
		{ label: 'Heuristic scale', value: scale }
	]);
}

function incomingNeighbors(
	snapshot: GraphDocument,
	nodeId: string
): ReturnType<typeof neighborsOf> {
	const incoming: ReturnType<typeof neighborsOf> = [];
	for (const edge of Object.values(snapshot.edges)) {
		if (edge.to === nodeId)
			incoming.push({ nodeId: edge.from, edgeId: edge.id, weight: edge.weight, edge });
		else if (!edge.directed && edge.from === nodeId)
			incoming.push({ nodeId: edge.to, edgeId: edge.id, weight: edge.weight, edge });
	}
	return incoming;
}

function runBidirectionalDijkstra(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const start = node(input, 'start');
	const end = node(input, 'end');
	if (hasReachableNegativeEdge(snapshot, start))
		return ineligibleShortestPath(
			start,
			end,
			'Bidirectional Dijkstra requires non-negative reachable edge weights.'
		);
	const ids = Object.keys(snapshot.nodes);
	const forward = new Map(ids.map((id) => [id, id === start ? 0 : Infinity]));
	const backward = new Map(ids.map((id) => [id, id === end ? 0 : Infinity]));
	const fromStart = new Map<string, { prev: string; edgeId: string }>();
	const toEnd = new Map<string, { prev: string; edgeId: string }>();
	const openF = new Set([start]);
	const openB = new Set([end]);
	const settledF = new Set<string>();
	const settledB = new Set<string>();
	const explored: string[] = [];
	const events: AnalysisEvent[] = [];
	let best = Infinity;
	let meeting: string | undefined;
	const minimum = (set: Set<string>, dist: Map<string, number>) =>
		[...set].sort((a, b) => dist.get(a)! - dist.get(b)!)[0];
	while (openF.size && openB.size) {
		const f = minimum(openF, forward);
		const b = minimum(openB, backward);
		if (forward.get(f)! + backward.get(b)! >= best) break;
		const forwardSide = forward.get(f)! <= backward.get(b)!;
		const current = forwardSide ? f : b;
		const own = forwardSide ? forward : backward;
		const other = forwardSide ? backward : forward;
		const open = forwardSide ? openF : openB;
		const settled = forwardSide ? settledF : settledB;
		const parents = forwardSide ? fromStart : toEnd;
		open.delete(current);
		if (settled.has(current)) continue;
		settled.add(current);
		explored.push(current);
		const neighbors = forwardSide
			? neighborsOf(snapshot, current)
			: incomingNeighbors(snapshot, current);
		for (const n of neighbors) {
			const candidate = own.get(current)! + n.weight;
			if (candidate < own.get(n.nodeId)!) {
				own.set(n.nodeId, candidate);
				parents.set(n.nodeId, { prev: current, edgeId: n.edgeId });
				open.add(n.nodeId);
				event(
					events,
					'relax',
					{ nodeId: n.nodeId, edgeId: n.edgeId, side: forwardSide ? 'start' : 'target' },
					[],
					[
						{
							inspector: forwardSide ? 'start-distances' : 'target-distances',
							operation: 'set',
							key: n.nodeId,
							value: candidate
						}
					]
				);
			}
			if (Number.isFinite(other.get(n.nodeId)!)) {
				const total = own.get(n.nodeId)! + other.get(n.nodeId)!;
				if (total < best) {
					best = total;
					meeting = n.nodeId;
				}
			}
		}
		if (Number.isFinite(other.get(current)!)) {
			const total = own.get(current)! + other.get(current)!;
			if (total < best) {
				best = total;
				meeting = current;
			}
		}
	}
	if (!meeting)
		return shortestPathOutput(
			snapshot,
			start,
			end,
			'Bidirectional Dijkstra',
			forward,
			fromStart,
			[...new Set(explored)],
			events
		);
	const left = reconstructPath(fromStart, start, meeting)!;
	const nodeIds = [...left.nodeIds];
	const edgeIds = [...left.edgeIds];
	let current = meeting;
	while (current !== end) {
		const next = toEnd.get(current);
		if (!next) break;
		edgeIds.push(next.edgeId);
		nodeIds.push(next.prev);
		current = next.prev;
	}
	const joined = current === end ? { nodeIds, edgeIds } : null;
	if (!joined)
		return shortestPathOutput(
			snapshot,
			start,
			end,
			'Bidirectional Dijkstra',
			forward,
			fromStart,
			[...new Set(explored)],
			events
		);
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	for (let i = 1; i < joined.nodeIds.length; i++)
		cameFrom.set(joined.nodeIds[i], { prev: joined.nodeIds[i - 1], edgeId: joined.edgeIds[i - 1] });
	const joinedDistances = new Map(forward);
	joinedDistances.set(end, best);
	return shortestPathOutput(
		snapshot,
		start,
		end,
		'Bidirectional Dijkstra',
		joinedDistances,
		cameFrom,
		[...new Set(explored)],
		events,
		[{ label: 'Meeting cost', value: best }]
	);
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

export const iddfsDefinition: AnalysisDefinition = {
	id: 'iddfs',
	name: 'Iterative Deepening DFS',
	category: 'Traversal',
	description: 'Repeat depth-limited DFS with increasing limits until found or exhausted.',
	fields: traversalModeFields(),
	execute: runIddfs
};

export const randomWalkDefinition: AnalysisDefinition = {
	id: 'random-walk',
	name: 'Random Walk',
	category: 'Traversal',
	description: 'Follow randomly selected traversable edges with a reproducible optional seed.',
	fields: traversalModeFields([
		{
			kind: 'number',
			id: 'maxSteps',
			label: 'Max steps',
			required: true,
			defaultValue: 100,
			min: 1,
			max: 10_000,
			integer: true
		},
		{
			kind: 'number',
			id: 'seed',
			label: 'Seed (optional)',
			min: 0,
			max: 0xffffffff,
			integer: true
		}
	]),
	execute: runRandomWalk
};

export const multiSourceBfsDefinition: AnalysisDefinition = {
	id: 'multi-source-bfs',
	name: 'Multi-source BFS',
	category: 'Traversal',
	description: 'Traverse or search in combined breadth waves from several starting nodes.',
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
		{ kind: 'node-set', id: 'starts', label: 'Starts', required: true },
		{
			kind: 'node',
			id: 'target',
			label: 'Target',
			required: true,
			when: { fieldId: 'mode', equals: 'search' }
		}
	],
	execute: runMultiSourceBfs
};

export const bidirectionalBfsDefinition: AnalysisDefinition = {
	id: 'bidirectional-bfs',
	name: 'Bidirectional BFS',
	category: 'Traversal',
	description: 'Search from Start and Target in simultaneous breadth-first waves.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'target', label: 'Target', required: true }
	],
	execute: runBidirectionalBfs
};

function connectivityNoResult(summary: string): AnalysisOutput {
	return { result: { outcome: 'no-result', summary, metrics: [], artifacts: [] }, events: [] };
}

function connectivityRejected(summary: string): AnalysisOutput {
	return { result: { outcome: 'rejected', summary, metrics: [], artifacts: [] }, events: [] };
}

function runPlanarityAnalysis(snapshot: GraphDocument, includeEmbedding: boolean): AnalysisOutput {
	const name = includeEmbedding ? 'Planar Embedding' : 'Planarity Test';
	const nodeIds = Object.keys(snapshot.nodes);
	const edges = Object.values(snapshot.edges);
	if (!nodeIds.length) return connectivityNoResult(`${name} requires at least one node.`);
	if (edges.some((edge) => edge.directed))
		return connectivityRejected(`${name} requires every edge to be undirected.`);
	const result = leftRightPlanarity(snapshot);
	if (!result.planar && includeEmbedding)
		return {
			...connectivityNoResult('The graph is nonplanar and has no planar embedding.'),
			events: result.events
		};
	if (includeEmbedding) {
		return {
			result: {
				outcome: 'complete',
				summary: `Planar embedding computed for ${nodeIds.length} nodes and ${edges.length} stored edges.`,
				metrics: [
					{ label: 'Planar', value: 'Yes' },
					{ label: 'Nodes', value: nodeIds.length },
					{ label: 'Stored edges', value: edges.length }
				],
				artifacts: [
					{
						kind: 'table',
						id: 'rotation-system',
						label: 'Clockwise rotation system',
						columns: ['Node', 'Clockwise incident edge IDs'],
						rows: nodeIds.map((id, index) => [id, result.rotations[index]])
					}
				]
			},
			events: result.events
		};
	}
	return {
		result: {
			outcome: 'complete',
			summary: `${result.planar ? 'Planar' : 'Nonplanar'}: the undirected graph with ${nodeIds.length} nodes and ${edges.length} stored edges ${result.planar ? 'admits a crossing-free embedding.' : 'does not admit a crossing-free embedding.'}`,
			metrics: [
				{ label: 'Classification', value: result.planar ? 'Planar' : 'Nonplanar' },
				{ label: 'Nodes', value: nodeIds.length },
				{ label: 'Stored edges', value: edges.length }
			],
			artifacts: []
		},
		events: result.events
	};
}

function runPlanarityTest(snapshot: GraphDocument): AnalysisOutput {
	return runPlanarityAnalysis(snapshot, false);
}

function runPlanarEmbedding(snapshot: GraphDocument): AnalysisOutput {
	return runPlanarityAnalysis(snapshot, true);
}

function undirectedNeighbors(snapshot: GraphDocument, nodeId: string) {
	return Object.values(snapshot.edges).flatMap((edge) => {
		if (edge.from === nodeId) return [{ nodeId: edge.to, edgeId: edge.id }];
		if (edge.to === nodeId) return [{ nodeId: edge.from, edgeId: edge.id }];
		return [];
	});
}

type ConflictGraph = {
	ids: string[];
	neighbors: Map<string, Array<{ nodeId: string; edgeId: string }>>;
};

function coloringConflictGraph(snapshot: GraphDocument): ConflictGraph | string {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return 'The graph has no nodes.';
	const neighbors = new Map<string, Array<{ nodeId: string; edgeId: string }>>(
		ids.map((id) => [id, []])
	);
	const seen = new Set<string>();
	for (const edge of Object.values(snapshot.edges)) {
		if (edge.from === edge.to)
			return `Node ${snapshot.nodes[edge.from]?.label ?? edge.from} has a self-loop and cannot be properly colored.`;
		const key = [edge.from, edge.to].sort().join('\u0000');
		if (seen.has(key)) continue;
		seen.add(key);
		neighbors.get(edge.from)?.push({ nodeId: edge.to, edgeId: edge.id });
		neighbors.get(edge.to)?.push({ nodeId: edge.from, edgeId: edge.id });
	}
	return { ids, neighbors };
}

function bipartition(graph: ConflictGraph): Map<string, number> | null {
	const colors = new Map<string, number>();
	for (const start of graph.ids) {
		if (colors.has(start)) continue;
		colors.set(start, 0);
		const queue = [start];
		while (queue.length) {
			const current = queue.shift()!;
			for (const { nodeId } of graph.neighbors.get(current) ?? []) {
				if (!colors.has(nodeId)) {
					colors.set(nodeId, 1 - colors.get(current)!);
					queue.push(nodeId);
				} else if (colors.get(nodeId) === colors.get(current)) return null;
			}
		}
	}
	return colors;
}

function coloringOutput(
	name: string,
	graph: ConflictGraph,
	colors: Map<string, number>,
	events: AnalysisEvent[]
): AnalysisOutput {
	const classCount = Math.max(0, ...colors.values()) + 1;
	const parts = Array.from({ length: classCount }, (_, index) => ({
		label: `Color ${index + 1}`,
		nodeIds: graph.ids.filter((id) => colors.get(id) === index)
	}));
	const steps = graph.ids.map((nodeId) => ({
		actions: [{ kind: 'reveal-node' as const, nodeId, role: `color-${colors.get(nodeId)!}` }]
	}));
	return {
		result: {
			outcome: 'complete',
			summary: `${name} used ${classCount} color${classCount === 1 ? '' : 's'}.`,
			metrics: [
				{ label: 'Colors', value: classCount },
				{ label: 'Colored nodes', value: graph.ids.length }
			],
			artifacts: [{ kind: 'partition', id: 'colors', label: 'Color classes', parts }],
			reveal: { phases: [{ id: 'coloring', steps: oneObjectRevealSteps(steps) }] }
		},
		events
	};
}

function runColoring(
	snapshot: GraphDocument,
	mode: 'bipartite' | 'greedy' | 'welsh-powell' | 'dsatur'
): AnalysisOutput {
	const graph = coloringConflictGraph(snapshot);
	if (typeof graph === 'string')
		return graph === 'The graph has no nodes.'
			? connectivityNoResult(graph)
			: connectivityRejected(graph);
	const events: AnalysisEvent[] = [];
	const colors = new Map<string, number>();
	const assign = (nodeId: string, color: number) => {
		colors.set(nodeId, color);
		event(
			events,
			'assign-color',
			{ nodeId, color: color + 1 },
			[{ entity: 'node', id: nodeId, role: `color-${color}`, operation: 'add' }],
			[{ inspector: 'colors', operation: 'set', key: nodeId, value: color + 1 }]
		);
	};
	if (mode === 'bipartite') {
		const partition = bipartition(graph);
		if (!partition)
			return connectivityNoResult('The graph is not bipartite because it contains an odd cycle.');
		for (const id of graph.ids) assign(id, partition.get(id)!);
		return coloringOutput('Bipartite Check', graph, colors, events);
	}
	const lowestAvailable = (id: string) => {
		const unavailable = new Set(
			(graph.neighbors.get(id) ?? [])
				.map(({ nodeId }) => colors.get(nodeId))
				.filter((value): value is number => value !== undefined)
		);
		let color = 0;
		while (unavailable.has(color)) color++;
		return color;
	};
	if (mode === 'greedy') {
		for (const id of graph.ids) assign(id, lowestAvailable(id));
	} else if (mode === 'welsh-powell') {
		const ordered = [...graph.ids].sort(
			(a, b) =>
				(graph.neighbors.get(b)?.length ?? 0) - (graph.neighbors.get(a)?.length ?? 0) ||
				graph.ids.indexOf(a) - graph.ids.indexOf(b)
		);
		for (const id of ordered) if (!colors.has(id)) assign(id, lowestAvailable(id));
	} else {
		while (colors.size < graph.ids.length) {
			const next = graph.ids
				.filter((id) => !colors.has(id))
				.sort((a, b) => {
					const saturation = (id: string) =>
						new Set(
							(graph.neighbors.get(id) ?? [])
								.map(({ nodeId }) => colors.get(nodeId))
								.filter((value): value is number => value !== undefined)
						).size;
					return (
						saturation(b) - saturation(a) ||
						(graph.neighbors.get(b)?.length ?? 0) - (graph.neighbors.get(a)?.length ?? 0) ||
						graph.ids.indexOf(a) - graph.ids.indexOf(b)
					);
				})[0];
			assign(next, lowestAvailable(next));
		}
	}
	return coloringOutput(
		mode === 'greedy'
			? 'Greedy Coloring'
			: mode === 'welsh-powell'
				? 'Welsh-Powell Coloring'
				: 'DSATUR Coloring',
		graph,
		colors,
		events
	);
}

function runHopcroftKarp(snapshot: GraphDocument): AnalysisOutput {
	const graph = coloringConflictGraph(snapshot);
	if (typeof graph === 'string')
		return connectivityRejected('Hopcroft-Karp requires a bipartite graph: a self-loop was found.');
	const sides = bipartition(graph);
	if (!sides)
		return connectivityRejected(
			'Hopcroft-Karp requires a bipartite graph; an odd cycle was found.'
		);
	const left = graph.ids.filter((id) => sides.get(id) === 0);
	const pairLeft = new Map<string, string>();
	const pairRight = new Map<string, string>();
	const distance = new Map<string, number>();
	const events: AnalysisEvent[] = [];
	const bfs = () => {
		const queue: string[] = [];
		for (const id of left) {
			if (pairLeft.has(id)) distance.set(id, Infinity);
			else {
				distance.set(id, 0);
				queue.push(id);
			}
		}
		let found = false;
		while (queue.length) {
			const current = queue.shift()!;
			for (const { nodeId } of graph.neighbors.get(current) ?? []) {
				const mate = pairRight.get(nodeId);
				if (!mate) found = true;
				else if (distance.get(mate) === Infinity) {
					distance.set(mate, distance.get(current)! + 1);
					queue.push(mate);
				}
			}
		}
		return found;
	};
	const dfs = (current: string): boolean => {
		for (const { nodeId } of graph.neighbors.get(current) ?? []) {
			const mate = pairRight.get(nodeId);
			if (!mate || (distance.get(mate) === distance.get(current)! + 1 && dfs(mate))) {
				pairLeft.set(current, nodeId);
				pairRight.set(nodeId, current);
				return true;
			}
		}
		distance.set(current, Infinity);
		return false;
	};
	while (bfs())
		for (const id of left)
			if (!pairLeft.has(id) && dfs(id))
				event(events, 'augment-match', { nodeId: id, matchedWith: pairLeft.get(id)! });
	const edgeIds = left.flatMap((from) => {
		const to = pairLeft.get(from);
		if (!to) return [];
		return [
			(graph.neighbors.get(from) ?? []).find((neighbor) => neighbor.nodeId === to)?.edgeId
		].filter((id): id is string => Boolean(id));
	});
	const matched = edgeIds.flatMap((id) => {
		const edge = snapshot.edges[id];
		return edge ? [edge.from, edge.to] : [];
	});
	const steps: AnalysisRevealStep[] = edgeIds.flatMap((edgeId) => {
		const edge = snapshot.edges[edgeId]!;
		return [
			{ actions: [{ kind: 'emphasize-edge' as const, edgeId }] },
			{ actions: [{ kind: 'emphasize-node' as const, nodeId: edge.from }] },
			{ actions: [{ kind: 'emphasize-node' as const, nodeId: edge.to }] }
		];
	});
	return {
		result: {
			outcome: 'complete',
			summary: `Hopcroft-Karp found ${edgeIds.length} matched pair${edgeIds.length === 1 ? '' : 's'}.`,
			metrics: [
				{ label: 'Matching cardinality', value: edgeIds.length },
				{ label: 'Matched nodes', value: matched.length },
				{ label: 'Unmatched nodes', value: graph.ids.length - matched.length }
			],
			artifacts: [
				{ kind: 'edge-set', id: 'matching', label: 'Matching edges', edgeIds },
				{ kind: 'node-set', id: 'matched-nodes', label: 'Matched nodes', nodeIds: matched }
			],
			reveal: { phases: [{ id: 'matching', steps: oneObjectRevealSteps(steps) }] }
		},
		events
	};
}

type FlowStrategy = 'dfs' | 'bfs' | 'dinic';
type ResidualArc = {
	to: string;
	reverseIndex: number;
	capacity: number;
	edgeId: string;
	edgeIndex: number;
	direction: 1 | -1;
};

function flowNoResult(snapshot: GraphDocument, input: AnalysisInput): string | null {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return 'The graph has no nodes.';
	const source = node(input, 'source');
	const sink = node(input, 'sink');
	if (!snapshot.nodes[source] || !snapshot.nodes[sink])
		return 'Choose Source and Sink nodes in the graph.';
	if (source === sink) return 'Source and Sink must be different nodes.';
	if (Object.values(snapshot.edges).some((edge) => !edge.directed))
		return 'Flow analysis requires every edge to be directed.';
	if (
		Object.values(snapshot.edges).some((edge) => !Number.isFinite(edge.weight) || edge.weight < 0)
	)
		return 'Flow analysis requires every capacity to be finite and non-negative.';
	return null;
}

function runFlowNetwork(snapshot: GraphDocument, input: AnalysisInput, strategy: FlowStrategy) {
	const source = node(input, 'source');
	const sink = node(input, 'sink');
	const ids = Object.keys(snapshot.nodes);
	const edges = Object.values(snapshot.edges);
	const adjacency = new Map<string, ResidualArc[]>(ids.map((id) => [id, []]));
	const flows = edges.map(() => 0);
	for (const [edgeIndex, edge] of edges.entries()) {
		const from = adjacency.get(edge.from)!;
		const to = adjacency.get(edge.to)!;
		const forward: ResidualArc = {
			to: edge.to,
			reverseIndex: to.length,
			capacity: edge.weight,
			edgeId: edge.id,
			edgeIndex,
			direction: 1
		};
		const reverse: ResidualArc = {
			to: edge.from,
			reverseIndex: from.length,
			capacity: 0,
			edgeId: edge.id,
			edgeIndex,
			direction: -1
		};
		from.push(forward);
		to.push(reverse);
	}
	const events: AnalysisEvent[] = [];
	const augmentations: Array<{ edgeIds: string[]; amount: number }> = [];
	let maximumFlow = 0;
	event(
		events,
		'initialize-flow',
		{ source, sink },
		[],
		[
			{ inspector: 'maximum-flow', operation: 'reset', kind: 'scalar', value: 0 },
			{ inspector: 'augmenting-path', operation: 'reset', kind: 'ordered-list', value: [] }
		]
	);
	const applyPath = (path: Array<{ from: string; arcIndex: number }>, amount: number) => {
		const edgeIds: string[] = [];
		const renderedEdgeIds: string[] = [];
		const traceSteps: string[] = [];
		for (const { from, arcIndex } of path) {
			const arc = adjacency.get(from)![arcIndex];
			const reverse = adjacency.get(arc.to)![arc.reverseIndex];
			arc.capacity -= amount;
			reverse.capacity += amount;
			flows[arc.edgeIndex] += amount * arc.direction;
			if (!edgeIds.includes(arc.edgeId)) edgeIds.push(arc.edgeId);
			traceSteps.push(arc.direction === 1 ? arc.edgeId : `${arc.edgeId} (reverse residual)`);
			if (arc.direction === 1 && !renderedEdgeIds.includes(arc.edgeId))
				renderedEdgeIds.push(arc.edgeId);
		}
		maximumFlow += amount;
		augmentations.push({ edgeIds, amount });
		event(
			events,
			'augment-flow',
			{
				amount,
				maximumFlow,
				reverseResidualSteps: traceSteps.filter((step) => step.endsWith('(reverse residual)'))
					.length
			},
			renderedEdgeIds.map((id) => ({
				entity: 'edge' as const,
				id,
				role: 'inspecting',
				operation: 'add' as const
			})),
			[
				{
					inspector: 'augmenting-path',
					operation: 'reset',
					kind: 'ordered-list',
					value: traceSteps
				},
				{ inspector: 'maximum-flow', operation: 'set', value: maximumFlow }
			]
		);
		event(
			events,
			'augment-complete',
			{ amount, maximumFlow },
			renderedEdgeIds.map((id) => ({
				entity: 'edge' as const,
				id,
				role: 'inspecting',
				operation: 'remove' as const
			}))
		);
	};
	const findPath = (mode: 'dfs' | 'bfs') => {
		const visited = new Set([source]);
		const parent = new Map<string, { from: string; arcIndex: number }>();
		const pending = [source];
		while (pending.length) {
			const current = mode === 'dfs' ? pending.pop()! : pending.shift()!;
			if (current === sink) break;
			const arcs = adjacency.get(current)!;
			const indexes = mode === 'dfs' ? [...arcs.keys()].reverse() : [...arcs.keys()];
			for (const arcIndex of indexes) {
				const arc = arcs[arcIndex];
				if (arc.capacity <= 0 || visited.has(arc.to)) continue;
				visited.add(arc.to);
				parent.set(arc.to, { from: current, arcIndex });
				pending.push(arc.to);
			}
		}
		if (!parent.has(sink)) return null;
		const path: Array<{ from: string; arcIndex: number }> = [];
		let current = sink;
		let amount = Infinity;
		while (current !== source) {
			const step = parent.get(current)!;
			path.unshift(step);
			amount = Math.min(amount, adjacency.get(step.from)![step.arcIndex].capacity);
			current = step.from;
		}
		return { path, amount };
	};
	if (strategy !== 'dinic') {
		while (true) {
			const found = findPath(strategy);
			if (!found) break;
			applyPath(found.path, found.amount);
		}
	} else {
		while (true) {
			const levels = new Map<string, number>([[source, 0]]);
			const queue = [source];
			while (queue.length) {
				const current = queue.shift()!;
				for (const arc of adjacency.get(current)!) {
					if (arc.capacity > 0 && !levels.has(arc.to)) {
						levels.set(arc.to, levels.get(current)! + 1);
						queue.push(arc.to);
					}
				}
			}
			if (!levels.has(sink)) break;
			event(events, 'build-level-graph', { reachableNodes: levels.size });
			const nextArc = new Map(ids.map((id) => [id, 0]));
			const send = (
				current: string,
				available: number,
				path: Array<{ from: string; arcIndex: number }>
			): { amount: number; path: Array<{ from: string; arcIndex: number }> } | null => {
				if (current === sink) return { amount: available, path };
				const arcs = adjacency.get(current)!;
				while (nextArc.get(current)! < arcs.length) {
					const index = nextArc.get(current)!;
					const arc = arcs[index];
					if (arc.capacity <= 0 || levels.get(arc.to) !== levels.get(current)! + 1) {
						nextArc.set(current, index + 1);
						continue;
					}
					const sent = send(arc.to, Math.min(available, arc.capacity), [
						...path,
						{ from: current, arcIndex: index }
					]);
					if (sent?.amount) return sent;
					nextArc.set(current, index + 1);
				}
				return null;
			};
			while (true) {
				const sent = send(source, Infinity, []);
				if (!sent) break;
				applyPath(sent.path, sent.amount);
			}
		}
	}
	return { adjacency, flows, maximumFlow, augmentations, events };
}

function flowReveal(
	snapshot: GraphDocument,
	edgeIds: string[],
	role: 'result' | 'critical'
): AnalysisRevealStep[] {
	const seenNodes = new Set<string>();
	const steps: AnalysisRevealStep[] = [];
	for (const edgeId of edgeIds) {
		const edge = snapshot.edges[edgeId];
		if (!edge) continue;
		for (const nodeId of [edge.from, edge.to]) {
			if (seenNodes.has(nodeId)) continue;
			seenNodes.add(nodeId);
			steps.push({
				actions: [
					role === 'result'
						? { kind: 'emphasize-node', nodeId }
						: { kind: 'reveal-node', nodeId, role: 'critical' }
				]
			});
		}
		steps.push({
			actions: [
				role === 'result'
					? { kind: 'emphasize-edge', edgeId }
					: { kind: 'reveal-edge', edgeId, role: 'critical' }
			]
		});
	}
	return steps;
}

function runMaximumFlow(
	snapshot: GraphDocument,
	input: AnalysisInput,
	strategy: FlowStrategy,
	name: string
): AnalysisOutput {
	const invalid = flowNoResult(snapshot, input);
	if (invalid)
		return invalid === 'The graph has no nodes.' ||
			invalid === 'Choose Source and Sink nodes in the graph.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const run = runFlowNetwork(snapshot, input, strategy);
	const edges = Object.values(snapshot.edges);
	const positiveEdgeIds = edges.filter((_, index) => run.flows[index] > 0).map((edge) => edge.id);
	const nodeIds = [
		...new Set(positiveEdgeIds.flatMap((id) => [snapshot.edges[id].from, snapshot.edges[id].to]))
	];
	return {
		result: {
			outcome: 'complete',
			summary: `${name} found a maximum flow of ${run.maximumFlow}.`,
			metrics: [
				{ label: 'Maximum flow', value: run.maximumFlow },
				{ label: 'Augmentations', value: run.augmentations.length }
			],
			artifacts: [
				{
					kind: 'edge-set',
					id: 'flow-edges',
					label: 'Positive-flow edges',
					edgeIds: positiveEdgeIds
				},
				{ kind: 'node-set', id: 'flow-nodes', label: 'Flow endpoints', nodeIds },
				{
					kind: 'per-edge-values',
					id: 'edge-flow',
					label: 'Final flow by edge',
					values: Object.fromEntries(edges.map((edge, index) => [edge.id, run.flows[index]]))
				}
			],
			reveal: {
				phases: [{ id: 'flow-result', steps: flowReveal(snapshot, positiveEdgeIds, 'result') }]
			}
		},
		events: run.events
	};
}

function runMinimumCut(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const invalid = flowNoResult(snapshot, input);
	if (invalid)
		return invalid === 'The graph has no nodes.' ||
			invalid === 'Choose Source and Sink nodes in the graph.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const run = runFlowNetwork(snapshot, input, 'dinic');
	const source = node(input, 'source');
	const reachable = new Set([source]);
	const queue = [source];
	while (queue.length) {
		const current = queue.shift()!;
		for (const arc of run.adjacency.get(current)!) {
			if (arc.capacity > 0 && !reachable.has(arc.to)) {
				reachable.add(arc.to);
				queue.push(arc.to);
			}
		}
	}
	const ids = Object.keys(snapshot.nodes);
	const cutEdges = Object.values(snapshot.edges).filter(
		(edge) => reachable.has(edge.from) && !reachable.has(edge.to)
	);
	const cutCapacity = cutEdges.reduce((sum, edge) => sum + edge.weight, 0);
	return {
		result: {
			outcome: 'complete',
			summary: `Minimum Cut has capacity ${cutCapacity}.`,
			metrics: [
				{ label: 'Cut capacity', value: cutCapacity },
				{ label: 'Maximum flow', value: run.maximumFlow },
				{ label: 'Cut edges', value: cutEdges.length }
			],
			artifacts: [
				{
					kind: 'partition',
					id: 'cut-partition',
					label: 'Cut partition',
					parts: [
						{ label: 'Source side', nodeIds: ids.filter((id) => reachable.has(id)) },
						{ label: 'Sink side', nodeIds: ids.filter((id) => !reachable.has(id)) }
					]
				},
				{
					kind: 'edge-set',
					id: 'cut-edges',
					label: 'Cut edges',
					edgeIds: cutEdges.map((edge) => edge.id)
				}
			],
			reveal: {
				phases: [
					{
						id: 'minimum-cut',
						steps: flowReveal(
							snapshot,
							cutEdges.map((edge) => edge.id),
							'critical'
						)
					}
				]
			}
		},
		events: run.events
	};
}

const EXACT_ANALYSIS_NODE_LIMIT = 20;

function exactLimitNoResult(snapshot: GraphDocument, name: string): AnalysisOutput | null {
	const count = Object.keys(snapshot.nodes).length;
	if (!count) return connectivityNoResult('The graph has no nodes.');
	if (count > EXACT_ANALYSIS_NODE_LIMIT)
		return connectivityNoResult(
			`${name} is limited to ${EXACT_ANALYSIS_NODE_LIMIT} nodes to keep Analyze responsive.`
		);
	return null;
}

function homogeneousDirection(
	snapshot: GraphDocument
): 'directed' | 'undirected' | 'edgeless' | 'mixed' {
	const edges = Object.values(snapshot.edges);
	if (!edges.length) return 'edgeless';
	const directed = edges.some((edge) => edge.directed);
	const undirected = edges.some((edge) => !edge.directed);
	return directed && undirected ? 'mixed' : directed ? 'directed' : 'undirected';
}

function routeOutput(
	name: string,
	mode: 'path' | 'circuit',
	snapshot: GraphDocument,
	nodeIds: string[],
	edgeIds: string[],
	events: AnalysisEvent[]
): AnalysisOutput {
	const closed =
		mode === 'circuit' || (nodeIds.length > 1 && nodeIds[0] === nodeIds[nodeIds.length - 1]);
	const steps: AnalysisRevealStep[] = [];
	appendPathReplay(steps, { nodeIds, edgeIds });
	const landmarks = nodeIds.length
		? [
				{ nodeId: nodeIds[0], role: 'start' as const },
				...(closed || nodeIds.length === 1
					? []
					: [{ nodeId: nodeIds[nodeIds.length - 1], role: 'end' as const }])
			]
		: [];
	return {
		result: {
			outcome: 'complete',
			summary: `${name} found a ${closed ? 'closed' : 'open'} route with ${edgeIds.length} edge${edgeIds.length === 1 ? '' : 's'}.`,
			metrics: [
				{ label: 'Mode', value: mode === 'circuit' ? 'Circuit' : 'Path' },
				{ label: 'Visited nodes', value: new Set(nodeIds).size },
				{ label: 'Edges', value: edgeIds.length },
				{ label: 'Closed', value: closed ? 'Yes' : 'No' }
			],
			artifacts: [
				{ kind: 'path', id: 'route', label: `${name} route`, nodeIds, edgeIds },
				{ kind: 'landmarks', id: 'route-landmarks', label: 'Route endpoints', entries: landmarks }
			],
			reveal: { phases: [{ id: 'route', steps: oneObjectRevealSteps(steps) }] }
		},
		events
	};
}

function runEulerianRoute(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	const edges = Object.values(snapshot.edges);
	const direction = homogeneousDirection(snapshot);
	if (direction === 'mixed')
		return connectivityRejected(
			'Eulerian analysis requires all edges to share one direction type.'
		);
	const chosenStart = typeof input.start === 'string' ? input.start : undefined;
	if (chosenStart && !snapshot.nodes[chosenStart])
		return connectivityNoResult('Choose a Start node in the graph.');
	const mode = input.mode === 'circuit' ? 'circuit' : 'path';
	if (!edges.length) {
		const start = chosenStart ?? ids[0];
		return routeOutput('Eulerian', mode, snapshot, [start], [], []);
	}
	const incident = new Map(ids.map((id) => [id, new Set<string>()]));
	for (const edge of edges) {
		incident.get(edge.from)!.add(edge.to);
		incident.get(edge.to)!.add(edge.from);
	}
	const edgeBearing = ids.filter((id) => edges.some((edge) => edge.from === id || edge.to === id));
	const connected = new Set<string>([edgeBearing[0]]);
	const queue = [edgeBearing[0]];
	while (queue.length) {
		const current = queue.shift()!;
		for (const next of incident.get(current)!) {
			if (!connected.has(next)) {
				connected.add(next);
				queue.push(next);
			}
		}
	}
	if (edgeBearing.some((id) => !connected.has(id)))
		return connectivityNoResult('All edge-bearing nodes must belong to one connected region.');

	const circuitMode = mode === 'circuit';
	let validStarts: string[];
	if (direction === 'directed') {
		const incoming = new Map(ids.map((id) => [id, 0]));
		const outgoing = new Map(ids.map((id) => [id, 0]));
		for (const edge of edges) {
			outgoing.set(edge.from, outgoing.get(edge.from)! + 1);
			incoming.set(edge.to, incoming.get(edge.to)! + 1);
		}
		const positive = edgeBearing.filter((id) => outgoing.get(id)! - incoming.get(id)! === 1);
		const negative = edgeBearing.filter((id) => incoming.get(id)! - outgoing.get(id)! === 1);
		const invalid = edgeBearing.some((id) => Math.abs(outgoing.get(id)! - incoming.get(id)!) > 1);
		if (circuitMode) {
			if (edgeBearing.some((id) => outgoing.get(id) !== incoming.get(id)))
				return connectivityNoResult('A directed Eulerian circuit requires balanced in/out degree.');
			validStarts = edgeBearing.filter((id) => outgoing.get(id)! > 0);
		} else if (!invalid && positive.length === 1 && negative.length === 1) {
			validStarts = positive;
		} else if (!invalid && positive.length === 0 && negative.length === 0) {
			validStarts = edgeBearing.filter((id) => outgoing.get(id)! > 0);
		} else return connectivityNoResult('The directed graph has no Eulerian path.');
	} else {
		const degree = new Map(ids.map((id) => [id, 0]));
		for (const edge of edges) {
			degree.set(edge.from, degree.get(edge.from)! + (edge.from === edge.to ? 2 : 1));
			if (edge.from !== edge.to) degree.set(edge.to, degree.get(edge.to)! + 1);
		}
		const odd = edgeBearing.filter((id) => degree.get(id)! % 2 === 1);
		if (circuitMode && odd.length)
			return connectivityNoResult(
				'An undirected Eulerian circuit requires every degree to be even.'
			);
		if (!circuitMode && odd.length !== 0 && odd.length !== 2)
			return connectivityNoResult('The undirected graph has no Eulerian path.');
		validStarts = odd.length === 2 ? odd : edgeBearing;
	}
	if (chosenStart && !validStarts.includes(chosenStart))
		return connectivityNoResult('The selected Start cannot begin this Eulerian route.');
	const start = chosenStart ?? validStarts[0];
	const adjacency = new Map<string, Array<{ edgeId: string; to: string }>>(
		ids.map((id) => [id, []])
	);
	for (const edge of edges) {
		adjacency.get(edge.from)!.push({ edgeId: edge.id, to: edge.to });
		if (!edge.directed) adjacency.get(edge.to)!.push({ edgeId: edge.id, to: edge.from });
	}
	const used = new Set<string>();
	const stack = [start];
	const stackEdges: string[] = [];
	const reverseNodes: string[] = [];
	const reverseEdges: string[] = [];
	const events: AnalysisEvent[] = [];
	event(
		events,
		'initialize-eulerian-route',
		{ nodeId: start, edgeCount: edges.length },
		[],
		[
			{ inspector: 'current-node', operation: 'reset', kind: 'scalar', value: start },
			{
				inspector: 'remaining-edges',
				operation: 'reset',
				kind: 'set',
				value: edges.map((edge) => edge.id)
			},
			{ inspector: 'traversal-stack', operation: 'reset', kind: 'stack', value: [start] },
			{ inspector: 'emitted-route', operation: 'reset', kind: 'ordered-list', value: [] }
		]
	);
	while (stack.length) {
		const current = stack[stack.length - 1];
		const next = adjacency.get(current)!.find((entry) => !used.has(entry.edgeId));
		if (next) {
			used.add(next.edgeId);
			stack.push(next.to);
			stackEdges.push(next.edgeId);
			event(
				events,
				'traverse-eulerian-edge',
				{ nodeId: next.to, edgeId: next.edgeId },
				[{ entity: 'edge', id: next.edgeId, role: 'inspecting', operation: 'add' }],
				[
					{ inspector: 'current-node', operation: 'set', value: next.to },
					{ inspector: 'remaining-edges', operation: 'remove', value: next.edgeId },
					{ inspector: 'traversal-stack', operation: 'push', value: next.to }
				]
			);
			event(events, 'traverse-eulerian-edge-complete', { edgeId: next.edgeId }, [
				{ entity: 'edge', id: next.edgeId, role: 'inspecting', operation: 'remove' }
			]);
		} else {
			const emitted = stack.pop()!;
			reverseNodes.push(emitted);
			if (stackEdges.length) reverseEdges.push(stackEdges.pop()!);
			event(
				events,
				'emit-eulerian-node',
				{ nodeId: emitted },
				[],
				[
					{ inspector: 'current-node', operation: 'set', value: emitted },
					{ inspector: 'traversal-stack', operation: 'pop' },
					{ inspector: 'emitted-route', operation: 'append', value: emitted }
				]
			);
		}
	}
	if (used.size !== edges.length) return connectivityNoResult('No Eulerian route uses every edge.');
	return routeOutput(
		'Eulerian',
		mode,
		snapshot,
		reverseNodes.reverse(),
		reverseEdges.reverse(),
		events
	);
}

function routeEdgesBetween(
	snapshot: GraphDocument,
	from: string,
	to: string,
	direction: 'directed' | 'undirected' | 'edgeless'
): string[] {
	return Object.values(snapshot.edges)
		.filter(
			(edge) =>
				(edge.from === from && edge.to === to) ||
				(direction === 'undirected' && edge.from === to && edge.to === from)
		)
		.map((edge) => edge.id);
}

function runHamiltonianRoute(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const limited = exactLimitNoResult(snapshot, 'Exact Hamiltonian analysis');
	if (limited) return limited;
	const ids = Object.keys(snapshot.nodes);
	const direction = homogeneousDirection(snapshot);
	if (direction === 'mixed')
		return connectivityRejected(
			'Hamiltonian analysis requires all edges to share one direction type.'
		);
	const chosenStart = typeof input.start === 'string' ? input.start : undefined;
	if (chosenStart && !snapshot.nodes[chosenStart])
		return connectivityNoResult('Choose a Start node in the graph.');
	const mode = input.mode === 'circuit' ? 'circuit' : 'path';
	const circuitMode = mode === 'circuit';
	const events: AnalysisEvent[] = [];
	const starts = chosenStart ? [ids.indexOf(chosenStart)] : ids.map((_, index) => index);
	for (const startIndex of starts) {
		const failed = new Set<number>();
		let stateCount = 0;
		event(
			events,
			'initialize-hamiltonian-search',
			{ nodeId: ids[startIndex] },
			[],
			[
				{ inspector: 'dp-states', operation: 'reset', kind: 'scalar', value: 0 },
				{
					inspector: 'route-candidate',
					operation: 'reset',
					kind: 'ordered-list',
					value: [ids[startIndex]]
				},
				{ inspector: 'parent-decisions', operation: 'reset', kind: 'map', value: {} },
				{
					inspector: 'reconstructed-route',
					operation: 'reset',
					kind: 'ordered-list',
					value: []
				}
			]
		);
		const search = (
			current: number,
			mask: number,
			nodePath: string[],
			edgePath: string[]
		): { nodeIds: string[]; edgeIds: string[] } | null => {
			if (nodePath.length === ids.length) {
				const closers = routeEdgesBetween(snapshot, ids[current], ids[startIndex], direction);
				const closing = closers.find((edgeId) => !edgePath.includes(edgeId));
				if (circuitMode && !closing) return null;
				return closing
					? { nodeIds: [...nodePath, ids[startIndex]], edgeIds: [...edgePath, closing] }
					: { nodeIds: nodePath, edgeIds: edgePath };
			}
			const key = mask * ids.length + current;
			if (failed.has(key)) return null;
			stateCount++;
			boundedEvent(
				events,
				'evaluate-hamiltonian-state',
				{
					nodeId: ids[current],
					visitedNodes: nodePath.length,
					remainingNodes: ids.length - nodePath.length
				},
				[],
				[
					{ inspector: 'dp-states', operation: 'set', value: stateCount },
					{
						inspector: 'route-candidate',
						operation: 'reset',
						kind: 'ordered-list',
						value: nodePath
					}
				]
			);
			for (let next = 0; next < ids.length; next++) {
				if (mask & (1 << next)) continue;
				const edgeId = routeEdgesBetween(snapshot, ids[current], ids[next], direction)[0];
				if (!edgeId) continue;
				boundedEvent(events, 'inspect-hamiltonian-transition', {
					nodeId: ids[next],
					edgeId,
					visitedNodes: nodePath.length,
					remainingNodes: ids.length - nodePath.length
				});
				const found = search(
					next,
					mask | (1 << next),
					[...nodePath, ids[next]],
					[...edgePath, edgeId]
				);
				if (found) {
					boundedEvent(
						events,
						'retain-hamiltonian-parent',
						{ nodeId: ids[current], nextNodeId: ids[next] },
						[],
						[
							{
								inspector: 'parent-decisions',
								operation: 'set',
								key: `${mask}:${ids[current]}`,
								value: ids[next]
							}
						]
					);
					return found;
				}
			}
			failed.add(key);
			return null;
		};
		const found = search(startIndex, 1 << startIndex, [ids[startIndex]], []);
		if (found) {
			event(
				events,
				'reconstruct-hamiltonian-route',
				{ nodes: found.nodeIds.length },
				[],
				[
					{
						inspector: 'reconstructed-route',
						operation: 'reset',
						kind: 'ordered-list',
						value: found.nodeIds
					}
				]
			);
			return routeOutput('Hamiltonian', mode, snapshot, found.nodeIds, found.edgeIds, events);
		}
	}
	return connectivityNoResult('No Hamiltonian route satisfies the selected mode and Start.');
}

function lexicographicallyEarlier(left: number[], right: number[]): boolean {
	for (let index = 0; index < Math.min(left.length, right.length); index++) {
		if (left[index] !== right[index]) return left[index] < right[index];
	}
	return left.length < right.length;
}

function exactSetEligibility(snapshot: GraphDocument, name: string): AnalysisOutput | null {
	const limited = exactLimitNoResult(snapshot, name);
	if (limited) return limited;
	if (Object.values(snapshot.edges).some((edge) => edge.directed))
		return connectivityRejected(`${name} requires every edge to be undirected.`);
	return null;
}

function maximumCompatibleSet(
	ids: string[],
	compatible: (left: number, right: number) => boolean,
	allowed: (index: number) => boolean,
	events: AnalysisEvent[]
): number[] {
	let best: number[] = [];
	const compatibleMasks = ids.map((_, left) =>
		ids.reduce(
			(mask, _id, right) =>
				left !== right && compatible(left, right) ? mask | (1 << right) : mask,
			0
		)
	);
	const allowedMask = ids.reduce(
		(mask, _id, index) => (allowed(index) ? mask | (1 << index) : mask),
		0
	);
	const bitCount = (mask: number) => {
		let count = 0;
		for (let remaining = mask; remaining; remaining &= remaining - 1) count++;
		return count;
	};
	const improve = (candidate: number[]) => {
		if (
			candidate.length > best.length ||
			(candidate.length === best.length && lexicographicallyEarlier(candidate, best))
		) {
			best = [...candidate];
			boundedEvent(
				events,
				'update-best-set',
				{ size: best.length },
				[],
				[
					{
						inspector: 'best-set',
						operation: 'reset',
						kind: 'ordered-list',
						value: best.map((index) => ids[index])
					}
				]
			);
		}
	};
	const search = (chosen: number[], candidateMask: number) => {
		improve(chosen);
		const candidateCount = bitCount(candidateMask);
		boundedEvent(
			events,
			'inspect-exact-set-branch',
			{
				chosenSize: chosen.length,
				candidateCount,
				upperBound: chosen.length + candidateCount
			},
			[],
			[
				{
					inspector: 'current-set',
					operation: 'reset',
					kind: 'ordered-list',
					value: chosen.map((index) => ids[index])
				},
				{
					inspector: 'candidate-set',
					operation: 'reset',
					kind: 'set',
					value: ids.filter((_id, index) => Boolean(candidateMask & (1 << index)))
				},
				{
					inspector: 'upper-bound',
					operation: 'reset',
					kind: 'scalar',
					value: chosen.length + candidateCount
				}
			]
		);
		if (chosen.length + candidateCount < best.length) {
			boundedEvent(events, 'prune-exact-set-bound', {
				chosenSize: chosen.length,
				upperBound: chosen.length + candidateCount,
				bestSize: best.length
			});
			return;
		}
		if (!candidateMask) return;
		const nextBit = candidateMask & -candidateMask;
		const next = 31 - Math.clz32(nextBit);
		const rest = candidateMask & ~nextBit;
		search([...chosen, next], rest & compatibleMasks[next]);
		search(chosen, rest);
	};
	search([], allowedMask);
	return best;
}

function nodeSetOutput(
	name: string,
	nodeIds: string[],
	extraMetrics: AnalysisOutput['result']['metrics'],
	events: AnalysisEvent[]
): AnalysisOutput {
	const steps = nodeIds.map((nodeId) => ({
		actions: [{ kind: 'emphasize-node' as const, nodeId }]
	}));
	return {
		result: {
			outcome: 'complete',
			summary: `${name} contains ${nodeIds.length} node${nodeIds.length === 1 ? '' : 's'}.`,
			metrics: [{ label: 'Size', value: nodeIds.length }, ...extraMetrics],
			artifacts: [{ kind: 'node-set', id: 'result-set', label: name, nodeIds }],
			reveal: { phases: [{ id: 'result-set', steps }] }
		},
		events
	};
}

function undirectedAdjacency(snapshot: GraphDocument): Map<string, Set<string>> {
	const adjacency = new Map(Object.keys(snapshot.nodes).map((id) => [id, new Set<string>()]));
	for (const edge of Object.values(snapshot.edges)) {
		if (edge.from === edge.to) continue;
		adjacency.get(edge.from)!.add(edge.to);
		adjacency.get(edge.to)!.add(edge.from);
	}
	return adjacency;
}

function runMaximumClique(snapshot: GraphDocument): AnalysisOutput {
	const invalid = exactSetEligibility(snapshot, 'Maximum Clique');
	if (invalid) return invalid;
	const ids = Object.keys(snapshot.nodes);
	const adjacency = undirectedAdjacency(snapshot);
	const events: AnalysisEvent[] = [];
	const result = maximumCompatibleSet(
		ids,
		(left, right) => adjacency.get(ids[left])!.has(ids[right]),
		() => true,
		events
	);
	return nodeSetOutput(
		'Maximum clique',
		result.map((index) => ids[index]),
		[],
		events
	);
}

function runMaximumIndependentSet(snapshot: GraphDocument): AnalysisOutput {
	const invalid = exactSetEligibility(snapshot, 'Maximum Independent Set');
	if (invalid) return invalid;
	const ids = Object.keys(snapshot.nodes);
	const adjacency = undirectedAdjacency(snapshot);
	const looped = new Set(
		Object.values(snapshot.edges)
			.filter((edge) => edge.from === edge.to)
			.map((edge) => edge.from)
	);
	const events: AnalysisEvent[] = [];
	const result = maximumCompatibleSet(
		ids,
		(left, right) => !adjacency.get(ids[left])!.has(ids[right]),
		(index) => !looped.has(ids[index]),
		events
	);
	return nodeSetOutput(
		'Maximum independent set',
		result.map((index) => ids[index]),
		[],
		events
	);
}

function runMinimumVertexCover(snapshot: GraphDocument): AnalysisOutput {
	const invalid = exactSetEligibility(snapshot, 'Minimum Vertex Cover');
	if (invalid) return invalid;
	const ids = Object.keys(snapshot.nodes);
	const edges = Object.values(snapshot.edges);
	const forced = new Set(
		edges.filter((edge) => edge.from === edge.to).map((edge) => ids.indexOf(edge.from))
	);
	let best = ids.map((_, index) => index);
	const events: AnalysisEvent[] = [];
	event(
		events,
		'initialize-cover',
		{ forcedNodes: forced.size, edgeCount: edges.length },
		[],
		[
			{
				inspector: 'forced-nodes',
				operation: 'reset',
				kind: 'set',
				value: [...forced].map((index) => ids[index])
			},
			{
				inspector: 'current-cover',
				operation: 'reset',
				kind: 'set',
				value: [...forced].map((index) => ids[index])
			},
			{ inspector: 'uncovered-edge', operation: 'reset', kind: 'scalar', value: 'None' },
			{ inspector: 'cover-bound', operation: 'reset', kind: 'scalar', value: forced.size },
			{
				inspector: 'best-cover',
				operation: 'reset',
				kind: 'ordered-list',
				value: best.map((index) => ids[index])
			}
		]
	);
	const improve = (candidate: Set<number>) => {
		const ordered = [...candidate].sort((left, right) => left - right);
		if (
			ordered.length < best.length ||
			(ordered.length === best.length && lexicographicallyEarlier(ordered, best))
		) {
			best = ordered;
			boundedEvent(
				events,
				'update-best-cover',
				{ size: best.length },
				[],
				[
					{
						inspector: 'best-cover',
						operation: 'reset',
						kind: 'ordered-list',
						value: best.map((index) => ids[index])
					}
				]
			);
		}
	};
	const search = (chosen: Set<number>) => {
		if (chosen.size > best.length) {
			boundedEvent(
				events,
				'prune-cover-bound',
				{ size: chosen.size, bestSize: best.length },
				[],
				[{ inspector: 'cover-bound', operation: 'set', value: chosen.size }]
			);
			return;
		}
		const uncovered = edges.find(
			(edge) => !chosen.has(ids.indexOf(edge.from)) && !chosen.has(ids.indexOf(edge.to))
		);
		if (!uncovered) {
			improve(chosen);
			return;
		}
		boundedEvent(
			events,
			'inspect-cover-constraint',
			{ edgeId: uncovered.id, size: chosen.size },
			[],
			[
				{
					inspector: 'current-cover',
					operation: 'reset',
					kind: 'set',
					value: [...chosen].sort((left, right) => left - right).map((index) => ids[index])
				},
				{ inspector: 'uncovered-edge', operation: 'set', value: uncovered.id },
				{ inspector: 'cover-bound', operation: 'set', value: chosen.size }
			]
		);
		const endpoints = [ids.indexOf(uncovered.from), ids.indexOf(uncovered.to)].filter(
			(value, index, all) => all.indexOf(value) === index
		);
		for (const endpoint of endpoints.sort((left, right) => left - right)) {
			const next = new Set(chosen);
			next.add(endpoint);
			boundedEvent(events, 'inspect-cover-node', { nodeId: ids[endpoint], size: next.size });
			search(next);
		}
	};
	search(forced);
	return nodeSetOutput(
		'Minimum vertex cover',
		best.map((index) => ids[index]),
		[{ label: 'Covered edges', value: edges.length }],
		events
	);
}

type StructuralBfs = {
	distances: Map<string, number>;
	parents: Map<string, { nodeId: string; edgeId: string }>;
};

function undirectedMetricEligibility(
	snapshot: GraphDocument,
	name: string,
	requireConnected = true
): string | null {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return 'The graph has no nodes.';
	if (Object.values(snapshot.edges).some((edge) => edge.directed))
		return `${name} requires every edge to be undirected.`;
	if (!requireConnected) return null;
	const reached = new Set([ids[0]]);
	const queue = [ids[0]];
	while (queue.length) {
		const current = queue.shift()!;
		for (const { nodeId } of undirectedNeighbors(snapshot, current)) {
			if (reached.has(nodeId)) continue;
			reached.add(nodeId);
			queue.push(nodeId);
		}
	}
	return reached.size === ids.length
		? null
		: `${name} requires a connected graph so every whole-graph distance is finite.`;
}

function structuralBfs(
	snapshot: GraphDocument,
	start: string,
	excludedEdgeId?: string,
	events?: AnalysisEvent[]
): StructuralBfs {
	const distances = new Map<string, number>([[start, 0]]);
	const parents = new Map<string, { nodeId: string; edgeId: string }>();
	const queue = [start];
	if (events)
		boundedEvent(
			events,
			'start-eccentricity-source',
			{ nodeId: start },
			[],
			[
				{ inspector: 'source', operation: 'reset', kind: 'scalar', value: start },
				{ inspector: 'frontier', operation: 'reset', kind: 'queue', value: [start] },
				{ inspector: 'distances', operation: 'reset', kind: 'map', value: { [start]: 0 } }
			]
		);
	while (queue.length) {
		const current = queue.shift()!;
		if (events)
			boundedEvent(
				events,
				'inspect-eccentricity-node',
				{ nodeId: current },
				[],
				[{ inspector: 'frontier', operation: 'dequeue' }]
			);
		for (const neighbor of undirectedNeighbors(snapshot, current)) {
			if (neighbor.edgeId === excludedEdgeId || distances.has(neighbor.nodeId)) continue;
			distances.set(neighbor.nodeId, distances.get(current)! + 1);
			parents.set(neighbor.nodeId, { nodeId: current, edgeId: neighbor.edgeId });
			queue.push(neighbor.nodeId);
			if (events)
				boundedEvent(
					events,
					'discover-eccentricity-node',
					{ nodeId: neighbor.nodeId, edgeId: neighbor.edgeId },
					[],
					[
						{ inspector: 'frontier', operation: 'enqueue', value: neighbor.nodeId },
						{
							inspector: 'distances',
							operation: 'set',
							key: neighbor.nodeId,
							value: distances.get(neighbor.nodeId)
						}
					]
				);
		}
	}
	return { distances, parents };
}

function reconstructStructuralPath(
	start: string,
	end: string,
	parents: Map<string, { nodeId: string; edgeId: string }>
): { nodeIds: string[]; edgeIds: string[] } {
	const nodeIds = [end];
	const edgeIds: string[] = [];
	let current = end;
	while (current !== start) {
		const parent = parents.get(current)!;
		edgeIds.unshift(parent.edgeId);
		nodeIds.unshift(parent.nodeId);
		current = parent.nodeId;
	}
	return { nodeIds, edgeIds };
}

function eccentricityRuns(snapshot: GraphDocument): {
	ids: string[];
	runs: Map<string, StructuralBfs>;
	values: Map<string, number>;
	events: AnalysisEvent[];
} {
	const ids = Object.keys(snapshot.nodes);
	const runs = new Map<string, StructuralBfs>();
	const values = new Map<string, number>();
	const events: AnalysisEvent[] = [];
	for (const start of ids) {
		const run = structuralBfs(snapshot, start, undefined, events);
		runs.set(start, run);
		const value = Math.max(0, ...run.distances.values());
		values.set(start, value);
		boundedEvent(
			events,
			'complete-eccentricity-source',
			{ nodeId: start, eccentricity: value },
			[],
			[
				{ inspector: 'source', operation: 'reset', kind: 'scalar', value: start },
				{
					inspector: 'distances',
					operation: 'reset',
					kind: 'map',
					value: Object.fromEntries(run.distances)
				},
				{ inspector: 'eccentricity', operation: 'set', value }
			]
		);
	}
	return { ids, runs, values, events };
}

function runNodeEccentricity(snapshot: GraphDocument): AnalysisOutput {
	const invalid = undirectedMetricEligibility(snapshot, 'Node Eccentricity');
	if (invalid)
		return invalid === 'The graph has no nodes.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const data = eccentricityRuns(snapshot);
	const maximum = Math.max(0, ...data.values.values());
	const entries = data.ids.map((id) => ({
		id,
		value: maximum === 0 ? 0 : data.values.get(id)! / maximum
	}));
	return {
		result: {
			outcome: 'complete',
			summary: `Node eccentricity calculated for ${data.ids.length} node${data.ids.length === 1 ? '' : 's'}.`,
			metrics: [{ label: 'Nodes', value: data.ids.length }],
			artifacts: [
				{ kind: 'ranking', id: 'eccentricity-ranking', label: 'Eccentricity ranking', entries },
				{
					kind: 'table',
					id: 'eccentricities',
					label: 'Exact eccentricities',
					columns: ['Node', 'Eccentricity'],
					rows: data.ids.map((id) => [id, data.values.get(id)!])
				}
			],
			reveal: {
				phases: [
					{
						id: 'eccentricities',
						steps: data.ids.map((nodeId) => ({
							actions: [{ kind: 'reveal-node' as const, nodeId, role: 'result' }]
						}))
					}
				]
			}
		},
		events: data.events
	};
}

function runGraphDiameter(snapshot: GraphDocument): AnalysisOutput {
	const invalid = undirectedMetricEligibility(snapshot, 'Graph Diameter');
	if (invalid)
		return invalid === 'The graph has no nodes.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const data = eccentricityRuns(snapshot);
	const diameter = Math.max(...data.values.values());
	let start = data.ids[0];
	let end = data.ids[0];
	outer: for (const from of data.ids) {
		for (const to of data.ids) {
			if (data.runs.get(from)!.distances.get(to) === diameter) {
				boundedEvent(data.events, 'consider-diameter-candidate', { from, to, distance: diameter });
				start = from;
				end = to;
				break outer;
			}
		}
	}
	const path = reconstructStructuralPath(start, end, data.runs.get(start)!.parents);
	boundedEvent(data.events, 'reconstruct-diameter-witness', {
		start,
		end,
		nodeIds: path.nodeIds.join(','),
		edgeIds: path.edgeIds.join(',')
	});
	const output = routeOutput(
		'Graph diameter',
		'path',
		snapshot,
		path.nodeIds,
		path.edgeIds,
		data.events
	);
	output.result.metrics.unshift({ label: 'Diameter', value: diameter });
	return output;
}

function runGraphRadius(snapshot: GraphDocument): AnalysisOutput {
	const invalid = undirectedMetricEligibility(snapshot, 'Graph Radius');
	if (invalid)
		return invalid === 'The graph has no nodes.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const data = eccentricityRuns(snapshot);
	let radius = Number.POSITIVE_INFINITY;
	for (const nodeId of data.ids) {
		radius = Math.min(radius, data.values.get(nodeId)!);
		boundedEvent(data.events, 'update-radius-minimum', { nodeId, radius });
	}
	return {
		result: {
			outcome: 'complete',
			summary: `Graph radius is ${radius}.`,
			metrics: [
				{ label: 'Radius', value: radius },
				{ label: 'Nodes', value: data.ids.length }
			],
			artifacts: []
		},
		events: data.events
	};
}

function runGraphCenter(snapshot: GraphDocument): AnalysisOutput {
	const invalid = undirectedMetricEligibility(snapshot, 'Graph Center');
	if (invalid)
		return invalid === 'The graph has no nodes.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const data = eccentricityRuns(snapshot);
	const radius = Math.min(...data.values.values());
	const center = data.ids.filter((id) => data.values.get(id) === radius);
	boundedEvent(data.events, 'select-center-radius', { radius });
	for (const nodeId of data.ids)
		boundedEvent(data.events, 'decide-center-membership', {
			nodeId,
			eccentricity: data.values.get(nodeId)!,
			included: center.includes(nodeId)
		});
	return nodeSetOutput('Graph center', center, [{ label: 'Radius', value: radius }], data.events);
}

type CycleWitness = { nodeIds: string[]; edgeIds: string[] };

function compareStoredEdgeSequences(
	left: string[],
	right: string[],
	edgeOrder: Map<string, number>
): number {
	for (let index = 0; index < Math.min(left.length, right.length); index++) {
		const difference = edgeOrder.get(left[index])! - edgeOrder.get(right[index])!;
		if (difference) return difference;
	}
	return left.length - right.length;
}

function compareStoredNodeSequences(
	left: string[],
	right: string[],
	nodeOrder: Map<string, number>
): number {
	for (let index = 0; index < Math.min(left.length, right.length); index++) {
		const difference = nodeOrder.get(left[index])! - nodeOrder.get(right[index])!;
		if (difference) return difference;
	}
	return left.length - right.length;
}

function canonicalCycle(
	witness: CycleWitness,
	edgeOrder: Map<string, number>,
	nodeOrder: Map<string, number>
): CycleWitness {
	const size = witness.edgeIds.length;
	const nodes = witness.nodeIds.slice(0, size);
	const candidates: CycleWitness[] = [];
	for (let offset = 0; offset < size; offset++) {
		const forwardNodes = Array.from({ length: size }, (_, index) => nodes[(offset + index) % size]);
		const forwardEdges = Array.from(
			{ length: size },
			(_, index) => witness.edgeIds[(offset + index) % size]
		);
		candidates.push({ nodeIds: [...forwardNodes, forwardNodes[0]], edgeIds: forwardEdges });
		const reverseNodes = Array.from(
			{ length: size },
			(_, index) => nodes[(offset - index + size) % size]
		);
		const reverseEdges = Array.from(
			{ length: size },
			(_, index) => witness.edgeIds[(offset - index - 1 + size) % size]
		);
		candidates.push({ nodeIds: [...reverseNodes, reverseNodes[0]], edgeIds: reverseEdges });
	}
	return candidates.sort((left, right) => {
		const edgeComparison = compareStoredEdgeSequences(left.edgeIds, right.edgeIds, edgeOrder);
		return edgeComparison || compareStoredNodeSequences(left.nodeIds, right.nodeIds, nodeOrder);
	})[0];
}

function shortestUndirectedCycle(
	snapshot: GraphDocument,
	events?: AnalysisEvent[]
): CycleWitness | null {
	const edges = Object.values(snapshot.edges);
	const edgeOrder = new Map(edges.map((edge, index) => [edge.id, index]));
	const nodeOrder = new Map(Object.keys(snapshot.nodes).map((nodeId, index) => [nodeId, index]));
	let best: CycleWitness | null = null;
	for (const edge of edges) {
		if (events)
			boundedEvent(events, 'inspect-cycle-closing-edge', { edgeId: edge.id }, [
				{ entity: 'edge', id: edge.id, role: 'inspecting', operation: 'add' }
			]);
		let candidate: CycleWitness | null = null;
		if (edge.from === edge.to) candidate = { nodeIds: [edge.from, edge.from], edgeIds: [edge.id] };
		else {
			if (events)
				boundedEvent(events, 'start-cycle-bfs', { root: edge.from, excludedEdge: edge.id });
			const run = structuralBfs(snapshot, edge.from, edge.id, events);
			if (run.distances.has(edge.to)) {
				const path = reconstructStructuralPath(edge.from, edge.to, run.parents);
				candidate = {
					nodeIds: [...path.nodeIds, edge.from],
					edgeIds: [...path.edgeIds, edge.id]
				};
			}
		}
		if (candidate) candidate = canonicalCycle(candidate, edgeOrder, nodeOrder);
		if (events && candidate)
			boundedEvent(events, 'measure-cycle-candidate', {
				edgeId: edge.id,
				length: candidate.edgeIds.length
			});
		if (
			candidate &&
			(!best ||
				candidate.edgeIds.length < best.edgeIds.length ||
				(candidate.edgeIds.length === best.edgeIds.length &&
					(compareStoredEdgeSequences(candidate.edgeIds, best.edgeIds, edgeOrder) < 0 ||
						(compareStoredEdgeSequences(candidate.edgeIds, best.edgeIds, edgeOrder) === 0 &&
							compareStoredNodeSequences(candidate.nodeIds, best.nodeIds, nodeOrder) < 0))))
		) {
			best = candidate;
			if (events)
				boundedEvent(events, 'retain-shortest-cycle', {
					edgeId: edge.id,
					girth: candidate.edgeIds.length
				});
		}
		if (events)
			boundedEvent(events, 'complete-cycle-closing-edge', { edgeId: edge.id }, [
				{ entity: 'edge', id: edge.id, role: 'inspecting', operation: 'remove' }
			]);
	}
	return best;
}

function runGraphGirth(snapshot: GraphDocument): AnalysisOutput {
	const invalid = undirectedMetricEligibility(snapshot, 'Graph Girth', false);
	if (invalid)
		return invalid === 'The graph has no nodes.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const events: AnalysisEvent[] = [];
	const cycle = shortestUndirectedCycle(snapshot, events);
	if (!cycle)
		return connectivityNoResult('Graph girth is undefined because the graph contains no cycle.');
	const output = routeOutput(
		'Graph girth',
		'circuit',
		snapshot,
		cycle.nodeIds,
		cycle.edgeIds,
		events
	);
	output.result.metrics.unshift({ label: 'Girth', value: cycle.edgeIds.length });
	return output;
}

function runGraphDensity(snapshot: GraphDocument): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	const direction = homogeneousDirection(snapshot);
	if (direction === 'mixed')
		return connectivityRejected('Graph Density requires all edges to share one direction type.');
	const directed = direction === 'directed';
	const adjacencies = new Set<string>();
	const events: AnalysisEvent[] = [];
	for (const edge of Object.values(snapshot.edges)) {
		if (edge.from === edge.to) {
			boundedEvent(events, 'ignore-density-loop', { edgeId: edge.id });
			continue;
		}
		const key = directed
			? `${edge.from}\u0000${edge.to}`
			: [edge.from, edge.to].sort().join('\u0000');
		const duplicate = adjacencies.has(key);
		adjacencies.add(key);
		boundedEvent(events, duplicate ? 'ignore-density-duplicate' : 'count-density-adjacency', {
			edgeId: edge.id
		});
	}
	const possible = directed ? ids.length * (ids.length - 1) : (ids.length * (ids.length - 1)) / 2;
	const density = possible === 0 ? 0 : adjacencies.size / possible;
	return {
		result: {
			outcome: 'complete',
			summary: `Graph density is ${density}.`,
			metrics: [
				{ label: 'Density', value: density },
				{ label: 'Nodes', value: ids.length },
				{ label: 'Distinct adjacencies', value: adjacencies.size },
				{ label: 'Possible adjacencies', value: possible },
				{ label: 'Direction', value: directed ? 'Directed' : 'Undirected' },
				{
					label: 'Formula',
					value: directed ? 'm / (n(n - 1))' : 'm / (n(n - 1) / 2)'
				}
			],
			artifacts: []
		},
		events
	};
}

function distributionRows(values: number[]): Array<[number, number]> {
	const maximum = Math.max(0, ...values);
	return Array.from({ length: maximum + 1 }, (_, degree) => [
		degree,
		values.filter((value) => value === degree).length
	]);
}

function runDegreeDistribution(snapshot: GraphDocument): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	const direction = homogeneousDirection(snapshot);
	if (direction === 'mixed')
		return connectivityRejected(
			'Degree Distribution requires all edges to share one direction type.'
		);
	const incoming = new Map(ids.map((id) => [id, 0]));
	const outgoing = new Map(ids.map((id) => [id, 0]));
	const degree = new Map(ids.map((id) => [id, 0]));
	const events: AnalysisEvent[] = [];
	for (const edge of Object.values(snapshot.edges)) {
		const increments: Record<string, number> = {};
		if (direction === 'directed') {
			outgoing.set(edge.from, outgoing.get(edge.from)! + 1);
			incoming.set(edge.to, incoming.get(edge.to)! + 1);
			increments[`${edge.from}:out`] = 1;
			increments[`${edge.to}:in`] = 1;
		} else if (edge.from === edge.to) {
			degree.set(edge.from, degree.get(edge.from)! + 2);
			increments[edge.from] = 2;
		} else {
			degree.set(edge.from, degree.get(edge.from)! + 1);
			degree.set(edge.to, degree.get(edge.to)! + 1);
			increments[edge.from] = 1;
			increments[edge.to] = 1;
		}
		boundedEvent(events, 'count-degree-edge', {
			edgeId: edge.id,
			increments: JSON.stringify(increments)
		});
	}
	const table = (id: string, label: string, values: number[]) => ({
		kind: 'table' as const,
		id,
		label,
		columns: ['Degree', 'Node count'],
		rows: distributionRows(values)
	});
	const artifacts =
		direction === 'directed'
			? [
					table(
						'in-degree-distribution',
						'In-degree distribution',
						ids.map((id) => incoming.get(id)!)
					),
					table(
						'out-degree-distribution',
						'Out-degree distribution',
						ids.map((id) => outgoing.get(id)!)
					),
					table(
						'total-degree-distribution',
						'Total-degree distribution',
						ids.map((id) => incoming.get(id)! + outgoing.get(id)!)
					)
				]
			: [
					table(
						'degree-distribution',
						'Degree distribution',
						ids.map((id) => degree.get(id)!)
					)
				];
	boundedEvent(events, 'build-degree-buckets', { tables: artifacts.length, nodes: ids.length });
	return {
		result: {
			outcome: 'complete',
			summary: `Degree distribution calculated for ${ids.length} nodes.`,
			metrics: [
				{ label: 'Nodes', value: ids.length },
				{ label: 'Edges', value: Object.keys(snapshot.edges).length },
				{ label: 'Direction', value: direction === 'directed' ? 'Directed' : 'Undirected' }
			],
			artifacts
		},
		events
	};
}

type WeightedUndirectedData = { ids: string[]; weights: number[][]; totalWeight: number };

function weightedUndirectedData(
	snapshot: GraphDocument,
	name: string
): WeightedUndirectedData | AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult(`${name} requires at least one node.`);
	const edges = Object.values(snapshot.edges);
	if (edges.some((edge) => edge.directed))
		return connectivityRejected(`${name} requires every edge to be undirected.`);
	if (edges.some((edge) => !Number.isFinite(edge.weight) || edge.weight < 0))
		return connectivityRejected(`${name} requires finite, nonnegative edge strengths.`);
	const index = new Map(ids.map((id, at) => [id, at]));
	const weights = ids.map(() => ids.map(() => 0));
	let totalWeight = 0;
	for (const edge of edges) {
		const from = index.get(edge.from)!;
		const to = index.get(edge.to)!;
		weights[from][to] += edge.weight;
		if (from !== to) weights[to][from] += edge.weight;
		totalWeight += edge.weight;
	}
	return { ids, weights, totalWeight };
}

function weightedDegrees(weights: number[][]): number[] {
	return weights.map((row, nodeIndex) =>
		row.reduce((sum, weight, neighbor) => sum + weight * (nodeIndex === neighbor ? 2 : 1), 0)
	);
}

function modularityOf(weights: number[][], labels: number[], totalWeight: number): number {
	if (totalWeight === 0) return 0;
	const degrees = weightedDegrees(weights);
	const totalDegree = new Map<number, number>();
	const internalWeight = new Map<number, number>();
	for (let nodeIndex = 0; nodeIndex < labels.length; nodeIndex++) {
		const label = labels[nodeIndex];
		totalDegree.set(label, (totalDegree.get(label) ?? 0) + degrees[nodeIndex]);
		for (let neighbor = nodeIndex; neighbor < labels.length; neighbor++)
			if (labels[neighbor] === label)
				internalWeight.set(label, (internalWeight.get(label) ?? 0) + weights[nodeIndex][neighbor]);
	}
	let modularity = 0;
	for (const [label, inside] of internalWeight) {
		const fraction = (totalDegree.get(label) ?? 0) / (2 * totalWeight);
		modularity += inside / totalWeight - fraction * fraction;
	}
	return modularity;
}

function normalizedCommunityLabels(labels: number[]): number[] {
	const groups = new Map<number, number>();
	return labels.map((label) => {
		if (!groups.has(label)) groups.set(label, groups.size);
		return groups.get(label)!;
	});
}

function communityGroups(ids: string[], labels: number[]): string[][] {
	const normalized = normalizedCommunityLabels(labels);
	const groups: string[][] = [];
	for (let index = 0; index < ids.length; index++) {
		const community = normalized[index];
		(groups[community] ??= []).push(ids[index]);
	}
	return groups;
}

function communityResult(
	name: string,
	snapshot: GraphDocument,
	groups: string[][],
	modularity: number,
	passes: number,
	stopReason: string,
	events: AnalysisEvent[]
): AnalysisOutput {
	const output = componentOutput(name, snapshot, groups, events);
	output.result.summary = `${name} found ${groups.length} communities (modularity ${modularity}).`;
	output.result.metrics.push(
		{ label: 'Nodes', value: Object.keys(snapshot.nodes).length },
		{ label: 'Modularity', value: modularity },
		{ label: 'Update passes', value: passes },
		{ label: 'Stop reason', value: stopReason }
	);
	return output;
}

function compareNumberSequences(left: number[], right: number[]): number {
	for (let index = 0; index < Math.min(left.length, right.length); index++) {
		if (left[index] !== right[index]) return left[index] - right[index];
	}
	return left.length - right.length;
}

function localModularityMoves(
	weights: number[][],
	initialLabels: number[],
	totalWeight: number,
	events: AnalysisEvent[],
	level: number
): { labels: number[]; modularity: number; passes: number; stoppedByGuard: boolean } {
	const labels = [...initialLabels];
	let passes = 0;
	let moved = true;
	while (moved && passes < 100) {
		moved = false;
		passes++;
		for (let nodeIndex = 0; nodeIndex < labels.length; nodeIndex++) {
			const previous = labels[nodeIndex];
			const candidates = new Set<number>([previous]);
			for (let neighbor = 0; neighbor < labels.length; neighbor++)
				if (neighbor !== nodeIndex && weights[nodeIndex][neighbor] > 0)
					candidates.add(labels[neighbor]);
			const orderedCandidates = [...candidates].sort((left, right) => left - right);
			const before = modularityOf(weights, labels, totalWeight);
			let best = previous;
			let bestValue = before;
			for (const candidate of orderedCandidates) {
				if (candidate === previous) continue;
				labels[nodeIndex] = candidate;
				const value = modularityOf(weights, labels, totalWeight);
				if (
					value > bestValue + 1e-12 ||
					(Math.abs(value - bestValue) <= 1e-12 && candidate < best)
				) {
					best = candidate;
					bestValue = value;
				}
			}
			labels[nodeIndex] = best;
			if (best !== previous) {
				moved = true;
				boundedEvent(events, 'move-louvain-node', {
					level,
					nodeIndex,
					fromCommunity: previous,
					toCommunity: best,
					modularity: bestValue
				});
			}
		}
		boundedEvent(events, 'complete-louvain-pass', {
			level,
			pass: passes,
			communities: new Set(labels).size,
			modularity: modularityOf(weights, labels, totalWeight)
		});
	}
	return {
		labels: normalizedCommunityLabels(labels),
		modularity: modularityOf(weights, labels, totalWeight),
		passes,
		stoppedByGuard: moved
	};
}

function aggregateCommunityWeights(weights: number[][], labels: number[]): number[][] {
	const groups = normalizedCommunityLabels(labels);
	const count = new Set(groups).size;
	const aggregated = Array.from({ length: count }, () => Array(count).fill(0) as number[]);
	for (let from = 0; from < weights.length; from++)
		for (let to = from; to < weights.length; to++) {
			const left = groups[from];
			const right = groups[to];
			const edgeWeight = weights[from][to];
			aggregated[left][right] += edgeWeight;
			if (left !== right) aggregated[right][left] += edgeWeight;
		}
	return aggregated;
}

function runLouvain(snapshot: GraphDocument): AnalysisOutput {
	const data = weightedUndirectedData(snapshot, 'Louvain');
	if ('result' in data) return data;
	const events: AnalysisEvent[] = [];
	if (data.totalWeight === 0) {
		const groups = data.ids.map((id) => [id]);
		boundedEvent(events, 'zero-strength-singletons', { nodes: data.ids.length });
		return communityResult('Louvain', snapshot, groups, 0, 0, 'Zero total strength', events);
	}
	let weights = data.weights;
	let members = data.ids.map((id) => [id]);
	let bestGroups = members;
	let bestModularity = modularityOf(
		weights,
		weights.map((_row, index) => index),
		data.totalWeight
	);
	let totalPasses = 0;
	let stopReason = 'Local optimum';
	for (let level = 0; level < 20; level++) {
		const initial = weights.map((_row, index) => index);
		const optimized = localModularityMoves(weights, initial, data.totalWeight, events, level + 1);
		totalPasses += optimized.passes;
		const count = new Set(optimized.labels).size;
		const levelGroups = Array.from({ length: count }, () => [] as string[]);
		members.forEach((group, index) => levelGroups[optimized.labels[index]].push(...group));
		if (optimized.modularity > bestModularity + 1e-12) {
			bestGroups = levelGroups;
			bestModularity = optimized.modularity;
		}
		boundedEvent(events, 'complete-louvain-level', {
			level: level + 1,
			communities: count,
			modularity: optimized.modularity
		});
		if (optimized.stoppedByGuard) {
			stopReason = 'Pass guard';
			break;
		}
		if (count === weights.length) break;
		weights = aggregateCommunityWeights(weights, optimized.labels);
		members = levelGroups;
		if (level === 19) stopReason = 'Level guard';
	}
	return communityResult(
		'Louvain',
		snapshot,
		bestGroups,
		bestModularity,
		totalPasses,
		stopReason,
		events
	);
}

function runLabelPropagation(snapshot: GraphDocument): AnalysisOutput {
	const data = weightedUndirectedData(snapshot, 'Label Propagation');
	if ('result' in data) return data;
	const events: AnalysisEvent[] = [];
	let labels = data.ids.map((_id, index) => index);
	let bestLabels = [...labels];
	let bestModularity = modularityOf(data.weights, labels, data.totalWeight);
	const seen = new Map<string, number>();
	const history: number[][] = [[...labels]];
	seen.set(labels.join(','), 0);
	let passes = 0;
	let stopReason = 'Stable labels';
	while (passes < 1000) {
		let changed = false;
		passes++;
		for (let nodeIndex = 0; nodeIndex < labels.length; nodeIndex++) {
			const votes = new Map<number, number>();
			for (let neighbor = 0; neighbor < labels.length; neighbor++) {
				const weight = data.weights[nodeIndex][neighbor] * (nodeIndex === neighbor ? 2 : 1);
				if (weight > 0) votes.set(labels[neighbor], (votes.get(labels[neighbor]) ?? 0) + weight);
			}
			if (!votes.size) {
				boundedEvent(events, 'evaluate-community-label-votes', {
					pass: passes,
					nodeIndex,
					currentLabel: labels[nodeIndex],
					selectedLabel: labels[nodeIndex],
					maximumVote: 0,
					tiedLabels: ''
				});
				continue;
			}
			const maximum = Math.max(...votes.values());
			const tied = [...votes]
				.filter(([, weight]) => Math.abs(weight - maximum) <= 1e-12)
				.map(([label]) => label)
				.sort((left, right) => left - right);
			const current = labels[nodeIndex];
			const selected = tied.includes(current) ? current : tied[0];
			boundedEvent(events, 'evaluate-community-label-votes', {
				pass: passes,
				nodeIndex,
				currentLabel: current,
				selectedLabel: selected ?? current,
				maximumVote: votes.size ? maximum : 0,
				tiedLabels: tied.join(',')
			});
			if (selected !== current) {
				labels[nodeIndex] = selected;
				changed = true;
				boundedEvent(events, 'propagate-community-label', {
					pass: passes,
					nodeIndex,
					label: selected,
					vote: maximum
				});
			}
		}
		labels = normalizedCommunityLabels(labels);
		const modularity = modularityOf(data.weights, labels, data.totalWeight);
		boundedEvent(events, 'complete-label-propagation-pass', {
			pass: passes,
			communities: new Set(labels).size,
			modularity
		});
		if (
			modularity > bestModularity + 1e-12 ||
			(Math.abs(modularity - bestModularity) <= 1e-12 &&
				compareNumberSequences(labels, bestLabels) < 0)
		) {
			bestLabels = [...labels];
			bestModularity = modularity;
		}
		if (!changed) break;
		const key = labels.join(',');
		if (seen.has(key)) {
			stopReason = 'Repeated assignment';
			break;
		}
		seen.set(key, history.length);
		history.push([...labels]);
	}
	if (passes === 1000) stopReason = 'Pass guard';
	return communityResult(
		'Label Propagation',
		snapshot,
		communityGroups(data.ids, bestLabels),
		bestModularity,
		passes,
		stopReason,
		events
	);
}

function runTravelingSalesman(snapshot: GraphDocument): AnalysisOutput {
	const limit = exactLimitNoResult(snapshot, 'Traveling Salesman');
	if (limit) return limit;
	const ids = Object.keys(snapshot.nodes);
	const edges = Object.values(snapshot.edges);
	const direction = homogeneousDirection(snapshot);
	if (direction === 'mixed')
		return connectivityRejected(
			'Traveling Salesman requires all edges to have the same direction type.'
		);
	if (edges.some((edge) => !Number.isFinite(edge.weight)))
		return connectivityRejected('Traveling Salesman requires every edge cost to be finite.');
	const n = ids.length;
	const index = new Map(ids.map((id, at) => [id, at]));
	const choices: ({ edgeId: string; cost: number } | null)[][] = Array.from({ length: n }, () =>
		Array(n).fill(null)
	);
	for (const edge of edges) {
		const from = index.get(edge.from)!;
		const to = index.get(edge.to)!;
		if (from === to) continue;
		const set = (a: number, b: number) => {
			const prior = choices[a][b];
			if (!prior || edge.weight < prior.cost)
				choices[a][b] = { edgeId: edge.id, cost: edge.weight };
		};
		set(from, to);
		if (!edge.directed) set(to, from);
	}
	const events: AnalysisEvent[] = [];
	if (n === 1) {
		const loop = edges
			.filter((edge) => edge.from === ids[0] && edge.to === ids[0])
			.reduce<GraphEdge | undefined>(
				(best, edge) => (best === undefined || edge.weight < best.weight ? edge : best),
				undefined
			);
		if (!loop)
			return connectivityNoResult(
				'A one-node Traveling Salesman circuit requires a stored self-loop.'
			);
		boundedEvent(events, 'select-traveling-salesman-singleton-loop', {
			edgeId: loop.id,
			cost: loop.weight
		});
		const result = routeOutput(
			'Traveling Salesman',
			'circuit',
			snapshot,
			[ids[0], ids[0]],
			[loop.id],
			events
		);
		result.result.metrics.push({ label: 'Total cost', value: loop.weight });
		return result;
	}
	if (n === 2) {
		const forward = edges.filter(
			(edge) =>
				(edge.from === ids[0] && edge.to === ids[1]) ||
				(!edge.directed && edge.from === ids[1] && edge.to === ids[0])
		);
		const backward = edges.filter(
			(edge) =>
				(edge.from === ids[1] && edge.to === ids[0]) ||
				(!edge.directed && edge.from === ids[0] && edge.to === ids[1])
		);
		let best: { cost: number; first: string; second: string } | undefined;
		for (const first of forward)
			for (const second of backward) {
				if (first.id === second.id) continue;
				const cost = first.weight + second.weight;
				if (!best || cost < best.cost) best = { cost, first: first.id, second: second.id };
			}
		if (!best)
			return connectivityNoResult(
				'No closed tour uses two distinct real edges between the two nodes.'
			);
		boundedEvent(events, 'select-traveling-salesman-two-node-tour', {
			firstEdge: best.first,
			secondEdge: best.second,
			cost: best.cost
		});
		const result = routeOutput(
			'Traveling Salesman',
			'circuit',
			snapshot,
			[ids[0], ids[1], ids[0]],
			[best.first, best.second],
			events
		);
		result.result.metrics.push({ label: 'Total cost', value: best.cost });
		return result;
	}
	const fullMask = (1 << n) - 1;
	const stateCount = 1 << n;
	const stateSlots = stateCount * n;
	const costs = new Float64Array(stateSlots);
	costs.fill(Number.POSITIVE_INFINITY);
	const parents = new Int8Array(stateSlots);
	parents.fill(-1);
	const slot = (mask: number, endpoint: number) => mask * n + endpoint;
	const pathPrefix = (mask: number, endpoint: number): number[] => {
		const path = [endpoint];
		while (endpoint !== 0) {
			const previous = parents[slot(mask, endpoint)];
			if (previous < 0) return [];
			mask ^= 1 << endpoint;
			endpoint = previous;
			path.push(endpoint);
		}
		return path.reverse();
	};
	const lexEarlier = (left: number[], right: number[]): boolean => {
		for (let index = 0; index < Math.min(left.length, right.length); index++) {
			if (left[index] !== right[index]) return left[index] < right[index];
		}
		return left.length < right.length;
	};
	costs[slot(1, 0)] = 0;
	for (let mask = 1; mask <= fullMask; mask++) {
		if ((mask & 1) === 0) continue;
		for (let last = 0; last < n; last++) {
			const currentCost = costs[slot(mask, last)];
			if (!Number.isFinite(currentCost)) continue;
			for (let next = 1; next < n; next++) {
				if (mask & (1 << next)) continue;
				const transition = choices[last][next];
				if (!transition) continue;
				const nextMask = mask | (1 << next);
				const candidate = currentCost + transition.cost;
				const nextSlot = slot(nextMask, next);
				const oldParent = parents[nextSlot];
				const equalCostEarlier =
					Math.abs(candidate - costs[nextSlot]) <= 1e-12 &&
					(oldParent < 0 || lexEarlier(pathPrefix(mask, last), pathPrefix(mask, oldParent)));
				boundedEvent(events, 'consider-tsp-transition', {
					mask,
					from: last,
					to: next,
					cost: candidate
				});
				if (candidate < costs[nextSlot] - 1e-12 || equalCostEarlier) {
					costs[nextSlot] = candidate;
					parents[nextSlot] = last;
					boundedEvent(events, 'retain-tsp-state', { mask: nextMask, last: next, cost: candidate });
				}
			}
		}
	}
	let last = -1;
	let bestCost = Number.POSITIVE_INFINITY;
	let closingEdge = '';
	for (let candidate = 1; candidate < n; candidate++) {
		const transition = choices[candidate][0];
		const cost = costs[slot(fullMask, candidate)] + (transition?.cost ?? Number.POSITIVE_INFINITY);
		if (
			transition &&
			(cost < bestCost - 1e-12 ||
				(Math.abs(cost - bestCost) <= 1e-12 &&
					(last < 0 || lexEarlier(pathPrefix(fullMask, candidate), pathPrefix(fullMask, last)))))
		) {
			bestCost = cost;
			last = candidate;
			closingEdge = transition.edgeId;
		}
	}
	if (last < 0) return connectivityNoResult('No closed tour visits every node exactly once.');
	const routeNodes = pathPrefix(fullMask, last);
	const nodeIds = [...routeNodes.map((at) => ids[at]), ids[0]];
	const edgeIds = routeNodes.slice(1).map((at, index) => choices[routeNodes[index]][at]!.edgeId);
	edgeIds.push(closingEdge);
	boundedEvent(events, 'reconstruct-tsp-tour', { nodes: nodeIds.length - 1, cost: bestCost });
	const result = routeOutput('Traveling Salesman', 'circuit', snapshot, nodeIds, edgeIds, events);
	result.result.metrics.push({ label: 'Total cost', value: bestCost });
	return result;
}

function runChinesePostman(snapshot: GraphDocument): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	const edges = Object.values(snapshot.edges);
	if (!ids.length) return connectivityNoResult('Chinese Postman requires at least one node.');
	if (edges.some((edge) => edge.directed))
		return connectivityRejected('Chinese Postman requires every edge to be undirected.');
	if (edges.some((edge) => !Number.isFinite(edge.weight) || edge.weight < 0))
		return connectivityRejected('Chinese Postman requires finite, nonnegative traversal costs.');
	const events: AnalysisEvent[] = [];
	if (!edges.length) {
		const output = routeOutput('Chinese Postman', 'circuit', snapshot, [ids[0]], [], events);
		output.result.metrics.push(
			{ label: 'Original edges', value: 0 },
			{ label: 'Total traversals', value: 0 },
			{ label: 'Repeated traversals', value: 0 },
			{ label: 'Total cost', value: 0 }
		);
		return output;
	}
	const index = new Map(ids.map((id, at) => [id, at]));
	const adjacency = ids.map(() => [] as { to: number; edgeId: string; cost: number }[]);
	const degree = ids.map(() => 0);
	const edgeBearing = new Set<number>();
	const edgeOrder = new Map(edges.map((edge, at) => [edge.id, at]));
	for (const edge of edges) {
		const from = index.get(edge.from)!;
		const to = index.get(edge.to)!;
		adjacency[from].push({ to, edgeId: edge.id, cost: edge.weight });
		if (from !== to) adjacency[to].push({ to: from, edgeId: edge.id, cost: edge.weight });
		degree[from] += from === to ? 2 : 1;
		degree[to] += from === to ? 0 : 1;
		edgeBearing.add(from);
		edgeBearing.add(to);
	}
	for (const row of adjacency)
		row.sort((left, right) => edgeOrder.get(left.edgeId)! - edgeOrder.get(right.edgeId)!);
	const reached = new Set<number>();
	const pending = [edgeBearing.values().next().value as number];
	reached.add(pending[0]);
	while (pending.length) {
		const current = pending.shift()!;
		for (const arc of adjacency[current])
			if (!reached.has(arc.to)) {
				reached.add(arc.to);
				pending.push(arc.to);
			}
	}
	if ([...edgeBearing].some((at) => !reached.has(at)))
		return connectivityNoResult('Disconnected edge regions prevent one closed postman route.');
	const odd = ids.map((_id, at) => at).filter((at) => degree[at] % 2 === 1);
	if (odd.length > 20)
		return connectivityNoResult(
			'Chinese Postman matching is limited to 20 odd-degree nodes to keep Analyze responsive.'
		);
	boundedEvent(
		events,
		'identify-odd-nodes',
		{ count: odd.length },
		odd.map((at) => ({
			entity: 'node',
			id: ids[at],
			role: 'inspecting' as const,
			operation: 'add' as const
		}))
	);
	const shortest = new Map<
		number,
		{ distances: number[]; previous: ({ node: number; edgeId: string } | null)[] }
	>();
	for (const source of odd) {
		const distances = ids.map(() => Number.POSITIVE_INFINITY);
		const previous = ids.map(() => null as { node: number; edgeId: string } | null);
		const pathEdges = ids.map(() => [] as number[]);
		const pathNodes = ids.map(() => [] as number[]);
		const visited = new Set<number>();
		distances[source] = 0;
		pathNodes[source] = [source];
		while (visited.size < ids.length) {
			let current = -1;
			for (let at = 0; at < ids.length; at++)
				if (
					!visited.has(at) &&
					Number.isFinite(distances[at]) &&
					(current < 0 ||
						distances[at] < distances[current] - 1e-12 ||
						(Math.abs(distances[at] - distances[current]) <= 1e-12 &&
							compareNumberSequences(pathEdges[at], pathEdges[current]) < 0))
				)
					current = at;
			if (current < 0) break;
			visited.add(current);
			for (const arc of adjacency[current]) {
				if (visited.has(arc.to) || pathNodes[current].includes(arc.to)) continue;
				const candidate = distances[current] + arc.cost;
				const candidatePath = [...pathEdges[current], edgeOrder.get(arc.edgeId)!];
				const distanceTie = Math.abs(candidate - distances[arc.to]) <= 1e-12;
				if (
					candidate < distances[arc.to] - 1e-12 ||
					(distanceTie && compareNumberSequences(candidatePath, pathEdges[arc.to]) < 0)
				) {
					distances[arc.to] = candidate;
					previous[arc.to] = { node: current, edgeId: arc.edgeId };
					pathEdges[arc.to] = candidatePath;
					pathNodes[arc.to] = [...pathNodes[current], arc.to];
				}
			}
		}
		shortest.set(source, { distances, previous });
		boundedEvent(events, 'complete-postman-shortest-paths', {
			source: ids[source],
			reachableNodes: distances.filter(Number.isFinite).length
		});
		for (const target of odd)
			if (target !== source)
				boundedEvent(events, 'postman-shortest-path-cost', {
					source: ids[source],
					target: ids[target],
					cost: distances[target]
				});
	}
	const matchingMemo = new Map<number, number>();
	const matchingChoice = new Map<number, number>();
	const solveMatching = (mask: number): number => {
		if (!mask) return 0;
		const cached = matchingMemo.get(mask);
		if (cached !== undefined) return cached;
		let first = 0;
		while ((mask & (1 << first)) === 0) first++;
		const rest = mask & ~(1 << first);
		let best = Number.POSITIVE_INFINITY;
		for (let second = first + 1; second < odd.length; second++) {
			if ((rest & (1 << second)) === 0) continue;
			const distance = shortest.get(odd[first])!.distances[odd[second]];
			const candidate = distance + solveMatching(rest & ~(1 << second));
			if (candidate < best - 1e-12) {
				best = candidate;
				matchingChoice.set(mask, second);
			}
		}
		matchingMemo.set(mask, best);
		return best;
	};
	const fullMask = (1 << odd.length) - 1;
	const addedCost = solveMatching(fullMask);
	if (!Number.isFinite(addedCost))
		return connectivityNoResult('Odd-degree nodes cannot be paired by real graph paths.');
	const duplicated: string[] = [];
	let mask = fullMask;
	while (mask) {
		let first = 0;
		while ((mask & (1 << first)) === 0) first++;
		const second = matchingChoice.get(mask)!;
		const source = odd[first];
		let current = odd[second];
		const chain: string[] = [];
		while (current !== source) {
			const step = shortest.get(source)!.previous[current];
			if (!step)
				return connectivityNoResult(
					'Could not reconstruct a real shortest path for postman matching.'
				);
			chain.push(step.edgeId);
			boundedEvent(events, 'duplicate-postman-edge-traversal', {
				edgeId: step.edgeId,
				from: ids[step.node],
				to: ids[current]
			});
			current = step.node;
		}
		duplicated.push(...chain.reverse());
		boundedEvent(events, 'pair-odd-nodes', {
			first: ids[source],
			second: ids[odd[second]],
			addedCost: shortest.get(source)!.distances[odd[second]]
		});
		mask &= ~(1 << first);
		mask &= ~(1 << second);
	}
	const traversalIds = [...edges.map((edge) => edge.id), ...duplicated];
	const instanceAdjacency = ids.map(() => [] as number[]);
	const instanceEnds: [number, number][] = [];
	for (const edgeId of traversalIds) {
		const edge = snapshot.edges[edgeId]!;
		const from = index.get(edge.from)!;
		const to = index.get(edge.to)!;
		const instance = instanceEnds.length;
		instanceEnds.push([from, to]);
		instanceAdjacency[from].push(instance);
		instanceAdjacency[to].push(instance);
	}
	const start = index.get(snapshot.edges[traversalIds[0]]!.from)!;
	const cursors = ids.map(() => 0);
	const used = new Set<number>();
	const nodeStack = [start];
	const edgeStack: number[] = [];
	const reverseNodes: number[] = [];
	const reverseEdges: number[] = [];
	while (nodeStack.length) {
		const current = nodeStack[nodeStack.length - 1];
		while (
			cursors[current] < instanceAdjacency[current].length &&
			used.has(instanceAdjacency[current][cursors[current]])
		)
			cursors[current]++;
		if (cursors[current] === instanceAdjacency[current].length) {
			const emitted = nodeStack.pop()!;
			reverseNodes.push(emitted);
			boundedEvent(events, 'emit-postman-route-node', {
				nodeId: ids[emitted],
				stackDepth: nodeStack.length
			});
			if (edgeStack.length) reverseEdges.push(edgeStack.pop()!);
		} else {
			const instance = instanceAdjacency[current][cursors[current]++];
			if (used.has(instance)) continue;
			used.add(instance);
			const [from, to] = instanceEnds[instance];
			const next = from === current ? to : from;
			nodeStack.push(next);
			edgeStack.push(instance);
			boundedEvent(events, 'extend-postman-route', {
				from: ids[current],
				to: ids[next],
				edgeId: traversalIds[instance],
				stackDepth: nodeStack.length
			});
		}
	}
	const nodeIds = reverseNodes.reverse().map((at) => ids[at]);
	const edgeIds = reverseEdges.reverse().map((instance) => traversalIds[instance]);
	if (edgeIds.length !== traversalIds.length)
		return connectivityNoResult('Could not construct one closed route covering every edge.');
	if (odd.length)
		boundedEvent(
			events,
			'clear-postman-odd-node-inspection',
			{ count: odd.length },
			odd.map((at) => ({
				entity: 'node',
				id: ids[at],
				role: 'inspecting' as const,
				operation: 'remove' as const
			}))
		);
	const output = routeOutput('Chinese Postman', 'circuit', snapshot, nodeIds, edgeIds, events);
	output.result.metrics.push(
		{ label: 'Original edges', value: edges.length },
		{ label: 'Total traversals', value: edgeIds.length },
		{ label: 'Repeated traversals', value: duplicated.length },
		{ label: 'Total cost', value: edges.reduce((sum, edge) => sum + edge.weight, 0) + addedCost }
	);
	return output;
}

function undirectedComponents(snapshot: GraphDocument, events?: AnalysisEvent[]): string[][] {
	const ids = Object.keys(snapshot.nodes);
	const seen = new Set<string>();
	const components: string[][] = [];
	for (const start of ids) {
		if (seen.has(start)) continue;
		const component: string[] = [];
		const stack = [{ nodeId: start, parentEdgeId: null as string | null }];
		seen.add(start);
		if (events) boundedEvent(events, 'start-forest-component', { root: start });
		while (stack.length) {
			const { nodeId: current, parentEdgeId } = stack.pop()!;
			component.push(current);
			if (events)
				boundedEvent(events, 'visit-forest-node', {
					nodeId: current,
					parentEdgeId: parentEdgeId ?? ''
				});
			const neighbors = undirectedNeighbors(snapshot, current);
			for (let index = neighbors.length - 1; index >= 0; index--) {
				const { nodeId, edgeId } = neighbors[index];
				if (events)
					boundedEvent(events, 'inspect-forest-edge', { nodeId, edgeId }, [
						{ entity: 'edge', id: edgeId, role: 'inspecting', operation: 'add' }
					]);
				if (events)
					boundedEvent(events, 'complete-forest-edge', { edgeId }, [
						{ entity: 'edge', id: edgeId, role: 'inspecting', operation: 'remove' }
					]);
				if (events)
					boundedEvent(events, 'check-forest-cycle', {
						edgeId,
						from: current,
						to: nodeId,
						seen: seen.has(nodeId),
						parentEdge: edgeId === parentEdgeId
					});
				if (seen.has(nodeId)) continue;
				seen.add(nodeId);
				if (events) boundedEvent(events, 'set-forest-parent-edge', { nodeId, edgeId });
				stack.push({ nodeId, parentEdgeId: edgeId });
			}
		}
		components.push(component);
	}
	return components;
}

function runTreeForestDetection(snapshot: GraphDocument): AnalysisOutput {
	const invalid = undirectedMetricEligibility(snapshot, 'Tree/Forest Detection', false);
	if (invalid)
		return invalid === 'The graph has no nodes.'
			? connectivityNoResult(invalid)
			: connectivityRejected(invalid);
	const events: AnalysisEvent[] = [];
	const components = undirectedComponents(snapshot, events);
	const cycle = shortestUndirectedCycle(snapshot, events);
	const classification = cycle ? 'Neither' : components.length === 1 ? 'Tree' : 'Forest';
	for (const [index, component] of components.entries())
		event(events, 'discover-forest-component', { component: index + 1, nodes: component.length });
	event(events, 'classify-tree-forest', { classification, components: components.length });
	const artifacts: AnalysisOutput['result']['artifacts'] = cycle
		? [{ kind: 'path', id: 'cycle-evidence', label: 'Cycle evidence', ...cycle }]
		: [
				{
					kind: 'partition',
					id: 'forest-components',
					label: 'Components',
					parts: components.map((nodeIds, index) => ({ label: `Component ${index + 1}`, nodeIds }))
				}
			];
	const reveal = cycle
		? {
				phases: [
					{
						id: 'cycle-evidence',
						steps: oneObjectRevealSteps([
							...cycle.nodeIds.map((nodeId) => ({
								actions: [{ kind: 'reveal-node' as const, nodeId, role: 'critical' }]
							})),
							...cycle.edgeIds.map((edgeId) => ({
								actions: [{ kind: 'reveal-edge' as const, edgeId, role: 'critical' }]
							}))
						])
					}
				]
			}
		: {
				phases: components.map((nodeIds, index) => ({
					id: `component-${index}`,
					steps: nodeIds.map((nodeId) => ({
						actions: [{ kind: 'reveal-node' as const, nodeId, role: `component-${index}` }]
					}))
				}))
			};
	return {
		result: {
			outcome: 'complete',
			summary: `Classification: ${classification}.`,
			metrics: [
				{ label: 'Classification', value: classification },
				{ label: 'Components', value: components.length },
				{ label: 'Nodes', value: Object.keys(snapshot.nodes).length },
				{ label: 'Edges', value: Object.keys(snapshot.edges).length }
			],
			artifacts,
			reveal
		},
		events
	};
}

function componentOutput(
	name: string,
	snapshot: GraphDocument,
	components: string[][],
	events: AnalysisEvent[]
): AnalysisOutput {
	return {
		result: {
			outcome: 'complete',
			summary: `${name} found ${components.length} component${components.length === 1 ? '' : 's'}.`,
			metrics: [{ label: 'Components', value: components.length }],
			artifacts: [
				{
					kind: 'partition',
					id: 'components',
					label: 'Components',
					parts: components.map((nodeIds, index) => ({ label: `Component ${index + 1}`, nodeIds }))
				}
			],
			reveal: {
				phases: components.map((nodes, index) => ({
					id: `component-${index}`,
					steps: oneObjectRevealSteps([
						{
							actions: nodes.map((nodeId) => ({
								kind: 'reveal-node' as const,
								nodeId,
								role: `component-${index}`
							}))
						}
					])
				}))
			}
		},
		events
	};
}

function runComponents(
	snapshot: GraphDocument,
	mode: 'connected' | 'weak' | 'strong'
): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	if (mode === 'connected' && Object.values(snapshot.edges).some((edge) => edge.directed))
		return connectivityRejected('Connected Components requires every edge to be undirected.');
	const outgoing = (id: string) =>
		mode === 'weak' || mode === 'connected'
			? undirectedNeighbors(snapshot, id)
			: neighborsOf(snapshot, id);
	const visited = new Set<string>();
	const components: string[][] = [];
	const events: AnalysisEvent[] = [];
	if (mode !== 'strong') {
		for (const start of ids)
			if (!visited.has(start)) {
				const queue = [start];
				visited.add(start);
				const members: string[] = [];
				while (queue.length) {
					const current = queue.shift()!;
					members.push(current);
					event(
						events,
						'visit',
						{ nodeId: current },
						[],
						[{ inspector: 'component', operation: 'append', value: current }]
					);
					for (const n of outgoing(current))
						if (!visited.has(n.nodeId)) {
							visited.add(n.nodeId);
							queue.push(n.nodeId);
						}
				}
				components.push(members);
			}
	} else {
		const finish: string[] = [];
		const seen = new Set<string>();
		const visit = (current: string) => {
			seen.add(current);
			for (const n of neighborsOf(snapshot, current)) if (!seen.has(n.nodeId)) visit(n.nodeId);
			finish.push(current);
		};
		ids.forEach((id) => {
			if (!seen.has(id)) visit(id);
		});
		const reverse = (id: string) =>
			undirectedNeighbors(snapshot, id).filter((n) =>
				snapshot.edges[n.edgeId].directed ? snapshot.edges[n.edgeId].to === id : true
			);
		while (finish.length) {
			const start = finish.pop()!;
			if (visited.has(start)) continue;
			const queue = [start];
			visited.add(start);
			const members: string[] = [];
			while (queue.length) {
				const current = queue.shift()!;
				members.push(current);
				event(
					events,
					'visit',
					{ nodeId: current },
					[],
					[{ inspector: 'component', operation: 'append', value: current }]
				);
				for (const n of reverse(current))
					if (!visited.has(n.nodeId)) {
						visited.add(n.nodeId);
						queue.push(n.nodeId);
					}
			}
			components.push(members);
		}
	}
	return componentOutput(
		mode === 'connected'
			? 'Connected Components'
			: mode === 'weak'
				? 'Weakly Connected Components'
				: 'Strongly Connected Components',
		snapshot,
		components,
		events
	);
}

function runCriticality(snapshot: GraphDocument, kind: 'bridges' | 'articulation'): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	if (Object.values(snapshot.edges).some((edge) => edge.directed))
		return connectivityRejected(
			`${kind === 'bridges' ? 'Bridges' : 'Articulation Points'} requires every edge to be undirected.`
		);
	let time = 0;
	const discovery = new Map<string, number>();
	const low = new Map<string, number>();
	const cutNodes = new Set<string>();
	const bridges: string[] = [];
	const events: AnalysisEvent[] = [];
	const visit = (current: string, parentEdge?: string) => {
		discovery.set(current, ++time);
		low.set(current, time);
		let children = 0;
		event(
			events,
			'discover',
			{ nodeId: current, discovery: time },
			[],
			[{ inspector: 'discovery', operation: 'set', key: current, value: time }]
		);
		for (const n of undirectedNeighbors(snapshot, current)) {
			if (n.edgeId === parentEdge) continue;
			if (!discovery.has(n.nodeId)) {
				children++;
				visit(n.nodeId, n.edgeId);
				low.set(current, Math.min(low.get(current)!, low.get(n.nodeId)!));
				if (low.get(n.nodeId)! > discovery.get(current)!) bridges.push(n.edgeId);
				if (
					(parentEdge === undefined && children > 1) ||
					(parentEdge !== undefined && low.get(n.nodeId)! >= discovery.get(current)!)
				)
					cutNodes.add(current);
			} else low.set(current, Math.min(low.get(current)!, discovery.get(n.nodeId)!));
		}
		event(
			events,
			'low-link',
			{ nodeId: current, low: low.get(current)! },
			[],
			[{ inspector: 'low-links', operation: 'set', key: current, value: low.get(current)! }]
		);
	};
	ids.forEach((id) => {
		if (!discovery.has(id)) visit(id);
	});
	const values = kind === 'bridges' ? bridges : [...cutNodes];
	const actions = values.map((id) =>
		kind === 'bridges'
			? { kind: 'reveal-edge' as const, edgeId: id, role: 'critical' }
			: { kind: 'reveal-node' as const, nodeId: id, role: 'critical' }
	);
	return {
		result: {
			outcome: 'complete',
			summary: `${kind === 'bridges' ? 'Bridges' : 'Articulation Points'} found ${values.length}.`,
			metrics: [{ label: 'Critical', value: values.length }],
			artifacts: [
				kind === 'bridges'
					? { kind: 'edge-set', id: 'bridges', label: 'Bridges', edgeIds: bridges }
					: {
							kind: 'node-set',
							id: 'articulation-points',
							label: 'Articulation points',
							nodeIds: [...cutNodes]
						}
			],
			reveal: {
				phases: [
					{
						id: 'critical',
						steps: oneObjectRevealSteps(actions.map((action) => ({ actions: [action] })))
					}
				]
			}
		},
		events
	};
}

function mstEligibility(snapshot: GraphDocument): string | undefined {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return 'The graph has no nodes.';
	if (Object.values(snapshot.edges).some((edge) => edge.directed))
		return 'Minimum spanning tree requires every edge to be undirected.';
	const seen = new Set([ids[0]]);
	const queue = [ids[0]];
	while (queue.length)
		for (const n of undirectedNeighbors(snapshot, queue.shift()!))
			if (!seen.has(n.nodeId)) {
				seen.add(n.nodeId);
				queue.push(n.nodeId);
			}
	return seen.size === ids.length ? undefined : 'A spanning tree cannot reach disconnected nodes.';
}

function mstOutput(
	name: string,
	snapshot: GraphDocument,
	edgeIds: string[],
	events: AnalysisEvent[]
): AnalysisOutput {
	const cost = edgeIds.reduce((sum, id) => sum + snapshot.edges[id].weight, 0);
	const nodeIds = Object.keys(snapshot.nodes);
	return {
		result: {
			outcome: 'complete',
			summary: `${name} found a minimum spanning tree.`,
			metrics: [
				{ label: 'Edge count', value: edgeIds.length },
				{ label: 'Total weight', value: cost }
			],
			artifacts: [{ kind: 'tree', id: 'mst', label: 'Minimum spanning tree', nodeIds, edgeIds }],
			reveal: {
				phases: [
					{
						id: 'tree',
						steps: oneObjectRevealSteps(
							edgeIds.flatMap((edgeId) => [
								{ actions: [{ kind: 'emphasize-edge' as const, edgeId }] }
							])
						)
					}
				]
			}
		},
		events
	};
}

function runKruskalMst(snapshot: GraphDocument): AnalysisOutput {
	const issue = mstEligibility(snapshot);
	if (issue)
		return issue.includes('disconnected nodes') || issue === 'The graph has no nodes.'
			? connectivityNoResult(issue)
			: connectivityRejected(issue);
	const parent = new Map(Object.keys(snapshot.nodes).map((id) => [id, id]));
	const find = (id: string): string => {
		const p = parent.get(id)!;
		if (p === id) return id;
		const root = find(p);
		parent.set(id, root);
		return root;
	};
	const edges = Object.values(snapshot.edges).sort((a, b) => a.weight - b.weight);
	const accepted: string[] = [];
	const events: AnalysisEvent[] = [];
	for (const edge of edges) {
		const left = find(edge.from);
		const right = find(edge.to);
		if (left !== right) {
			parent.set(left, right);
			accepted.push(edge.id);
			event(
				events,
				'accept',
				{ edgeId: edge.id, weight: edge.weight },
				[{ entity: 'edge', id: edge.id, role: 'result', operation: 'add' }],
				[{ inspector: 'disjoint-sets', operation: 'set', value: Object.fromEntries(parent) }]
			);
		} else
			event(events, 'reject', { edgeId: edge.id }, [
				{ entity: 'edge', id: edge.id, role: 'rejected', operation: 'add' }
			]);
	}
	return mstOutput('Kruskal', snapshot, accepted, events);
}

function runPrimMst(snapshot: GraphDocument): AnalysisOutput {
	const issue = mstEligibility(snapshot);
	if (issue)
		return issue.includes('disconnected nodes') || issue === 'The graph has no nodes.'
			? connectivityNoResult(issue)
			: connectivityRejected(issue);
	const ids = Object.keys(snapshot.nodes);
	const visited = new Set([ids[0]]);
	const accepted: string[] = [];
	const events: AnalysisEvent[] = [];
	while (visited.size < ids.length) {
		const candidate = Object.values(snapshot.edges)
			.filter((edge) => visited.has(edge.from) !== visited.has(edge.to))
			.sort((a, b) => a.weight - b.weight)[0];
		if (!candidate) break;
		accepted.push(candidate.id);
		visited.add(visited.has(candidate.from) ? candidate.to : candidate.from);
		event(
			events,
			'accept',
			{ edgeId: candidate.id, weight: candidate.weight },
			[{ entity: 'edge', id: candidate.id, role: 'result', operation: 'add' }],
			[{ inspector: 'tree-nodes', operation: 'set', value: [...visited] }]
		);
	}
	return mstOutput('Prim', snapshot, accepted, events);
}

function dagEligibility(snapshot: GraphDocument): string | undefined {
	if (!Object.keys(snapshot.nodes).length) return 'The graph has no nodes.';
	return Object.values(snapshot.edges).some((edge) => !edge.directed)
		? 'DAG utilities require every edge to be directed.'
		: undefined;
}

function runTopologicalSort(snapshot: GraphDocument): AnalysisOutput {
	const issue = dagEligibility(snapshot);
	if (issue)
		return issue === 'The graph has no nodes.'
			? connectivityNoResult(issue)
			: connectivityRejected(issue);
	const degree = new Map(Object.keys(snapshot.nodes).map((id) => [id, 0]));
	for (const edge of Object.values(snapshot.edges)) degree.set(edge.to, degree.get(edge.to)! + 1);
	const queue = Object.keys(snapshot.nodes).filter((id) => degree.get(id) === 0);
	const order: string[] = [];
	const events: AnalysisEvent[] = [];
	while (queue.length) {
		const current = queue.shift()!;
		order.push(current);
		event(
			events,
			'dequeue',
			{ nodeId: current },
			[],
			[{ inspector: 'zero-in-degree', operation: 'dequeue' }]
		);
		for (const n of neighborsOf(snapshot, current)) {
			degree.set(n.nodeId, degree.get(n.nodeId)! - 1);
			if (degree.get(n.nodeId) === 0) queue.push(n.nodeId);
		}
	}
	if (order.length !== Object.keys(snapshot.nodes).length)
		return connectivityNoResult(
			'No topological order exists because the graph contains a directed cycle.'
		);
	return {
		result: {
			outcome: 'complete',
			summary: 'Topological order found.',
			metrics: [{ label: 'Nodes', value: order.length }],
			artifacts: [
				{ kind: 'ordered-nodes', id: 'order', label: 'Topological order', nodeIds: order }
			],
			reveal: {
				phases: [
					{
						id: 'order',
						steps: oneObjectRevealSteps(
							order.map((nodeId) => ({ actions: [{ kind: 'reveal-node' as const, nodeId }] }))
						)
					}
				]
			}
		},
		events
	};
}

function runDirectedCycleDetection(snapshot: GraphDocument): AnalysisOutput {
	const issue = dagEligibility(snapshot);
	if (issue)
		return issue === 'The graph has no nodes.'
			? connectivityNoResult(issue)
			: connectivityRejected(issue);
	const ids = Object.keys(snapshot.nodes);
	const finish: string[] = [];
	const seen = new Set<string>();
	const visit = (id: string) => {
		seen.add(id);
		for (const n of neighborsOf(snapshot, id)) if (!seen.has(n.nodeId)) visit(n.nodeId);
		finish.push(id);
	};
	ids.forEach((id) => {
		if (!seen.has(id)) visit(id);
	});
	const assigned = new Set<string>();
	const cyclic = new Set<string>();
	const events: AnalysisEvent[] = [];
	const incoming = (id: string) =>
		Object.values(snapshot.edges)
			.filter((edge) => edge.to === id)
			.map((edge) => edge.from);
	while (finish.length) {
		const start = finish.pop()!;
		if (assigned.has(start)) continue;
		const members: string[] = [];
		const queue = [start];
		assigned.add(start);
		while (queue.length) {
			const current = queue.shift()!;
			members.push(current);
			for (const prev of incoming(current))
				if (!assigned.has(prev)) {
					assigned.add(prev);
					queue.push(prev);
				}
		}
		if (
			members.length > 1 ||
			Object.values(snapshot.edges).some((edge) => edge.from === start && edge.to === start)
		)
			members.forEach((id) => cyclic.add(id));
	}
	const edgeIds = Object.values(snapshot.edges)
		.filter((edge) => cyclic.has(edge.from) && cyclic.has(edge.to))
		.map((edge) => edge.id);
	const revealSteps: AnalysisRevealStep[] = [
		...[...cyclic].map((nodeId) => ({
			actions: [{ kind: 'reveal-node' as const, nodeId, role: 'critical' }]
		})),
		...edgeIds.map((edgeId) => ({
			actions: [{ kind: 'reveal-edge' as const, edgeId, role: 'critical' }]
		}))
	];
	cyclic.forEach((nodeId) =>
		event(events, 'cycle-member', { nodeId }, [
			{ entity: 'node', id: nodeId, role: 'critical', operation: 'add' }
		])
	);
	return {
		result: {
			outcome: 'complete',
			summary: cyclic.size
				? `Found ${cyclic.size} node${cyclic.size === 1 ? '' : 's'} in directed cycles.`
				: 'No directed cycles found.',
			metrics: [
				{ label: 'Cycle nodes', value: cyclic.size },
				{ label: 'Cycle edges', value: edgeIds.length }
			],
			artifacts: [
				{ kind: 'node-set', id: 'cycle-nodes', label: 'Cycle nodes', nodeIds: [...cyclic] },
				{ kind: 'edge-set', id: 'cycle-edges', label: 'Cycle edges', edgeIds }
			],
			reveal: {
				phases: [
					{
						id: 'cycles',
						steps: oneObjectRevealSteps(revealSteps)
					}
				]
			}
		},
		events
	};
}

function centralityOutput(
	name: string,
	snapshot: GraphDocument,
	scores: Map<string, number>,
	extra: AnalysisOutput['result']['artifacts'] = []
): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	const max = Math.max(0, ...scores.values());
	const entries = ids
		.map((id) => ({ id, value: max ? (scores.get(id) ?? 0) / max : 0 }))
		.sort((a, b) => b.value - a.value || ids.indexOf(a.id) - ids.indexOf(b.id));
	return {
		result: {
			outcome: 'complete',
			summary: `${name} ranking calculated.`,
			metrics: [{ label: 'Ranked nodes', value: ids.length }],
			artifacts: [{ kind: 'ranking', id: 'ranking', label: `${name} ranking`, entries }, ...extra],
			reveal: {
				phases: [
					{
						id: 'ranking',
						steps: oneObjectRevealSteps(
							entries.map((entry) => ({
								actions: [{ kind: 'reveal-node' as const, nodeId: entry.id }]
							}))
						)
					}
				]
			}
		},
		events: []
	};
}

function runDegreeCentrality(snapshot: GraphDocument): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	const incoming = new Map(ids.map((id) => [id, 0]));
	const outgoing = new Map(ids.map((id) => [id, 0]));
	for (const edge of Object.values(snapshot.edges)) {
		outgoing.set(edge.from, outgoing.get(edge.from)! + 1);
		incoming.set(edge.to, incoming.get(edge.to)! + 1);
		if (!edge.directed) {
			outgoing.set(edge.to, outgoing.get(edge.to)! + 1);
			incoming.set(edge.from, incoming.get(edge.from)! + 1);
		}
	}
	const total = new Map(ids.map((id) => [id, incoming.get(id)! + outgoing.get(id)!]));
	return centralityOutput('Degree centrality', snapshot, total, [
		{
			kind: 'table',
			id: 'degrees',
			label: 'Degrees',
			columns: ['Node', 'In', 'Out', 'Total'],
			rows: ids.map((id) => [id, incoming.get(id)!, outgoing.get(id)!, total.get(id)!])
		}
	]);
}

function runPageRank(snapshot: GraphDocument): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	let ranks = new Map(ids.map((id) => [id, 1 / ids.length]));
	for (let i = 0; i < 100; i++) {
		const next = new Map(ids.map((id) => [id, 0.15 / ids.length]));
		for (const from of ids) {
			const neighbors = neighborsOf(snapshot, from);
			if (!neighbors.length)
				for (const id of ids) next.set(id, next.get(id)! + (0.85 * ranks.get(from)!) / ids.length);
			else
				for (const n of neighbors)
					next.set(n.nodeId, next.get(n.nodeId)! + (0.85 * ranks.get(from)!) / neighbors.length);
		}
		const delta = ids.reduce((sum, id) => sum + Math.abs(next.get(id)! - ranks.get(id)!), 0);
		ranks = next;
		if (delta < 1e-6) break;
	}
	return centralityOutput('PageRank', snapshot, ranks);
}

function runBetweennessCentrality(snapshot: GraphDocument): AnalysisOutput {
	const ids = Object.keys(snapshot.nodes);
	if (!ids.length) return connectivityNoResult('The graph has no nodes.');
	const score = new Map(ids.map((id) => [id, 0]));
	for (const source of ids) {
		const stack: string[] = [];
		const predecessors = new Map(ids.map((id) => [id, [] as string[]]));
		const sigma = new Map(ids.map((id) => [id, id === source ? 1 : 0]));
		const distance = new Map(ids.map((id) => [id, id === source ? 0 : -1]));
		const queue = [source];
		while (queue.length) {
			const current = queue.shift()!;
			stack.push(current);
			for (const n of neighborsOf(snapshot, current)) {
				if (distance.get(n.nodeId) === -1) {
					distance.set(n.nodeId, distance.get(current)! + 1);
					queue.push(n.nodeId);
				}
				if (distance.get(n.nodeId) === distance.get(current)! + 1) {
					sigma.set(n.nodeId, sigma.get(n.nodeId)! + sigma.get(current)!);
					predecessors.get(n.nodeId)!.push(current);
				}
			}
		}
		const dependency = new Map(ids.map((id) => [id, 0]));
		while (stack.length) {
			const target = stack.pop()!;
			for (const previous of predecessors.get(target)!) {
				dependency.set(
					previous,
					dependency.get(previous)! +
						(sigma.get(previous)! / sigma.get(target)!) * (1 + dependency.get(target)!)
				);
			}
			if (target !== source) score.set(target, score.get(target)! + dependency.get(target)!);
		}
	}
	if (Object.values(snapshot.edges).some((edge) => !edge.directed))
		for (const id of ids) score.set(id, score.get(id)! / 2);
	const denominator = ids.length > 2 ? (ids.length - 1) * (ids.length - 2) : 1;
	for (const id of ids) score.set(id, score.get(id)! / denominator);
	return centralityOutput('Betweenness centrality', snapshot, score);
}

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

export const zeroOneBfsDefinition: AnalysisDefinition = {
	id: 'zero-one-bfs',
	name: '0–1 BFS',
	category: 'Shortest path',
	description: 'Find an optimal path when every edge weight is already 0 or 1.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'end', label: 'End', required: true }
	],
	execute: runZeroOneBfs
};

export const bellmanFordDefinition: AnalysisDefinition = {
	id: 'bellman-ford',
	name: 'Bellman–Ford Shortest Path',
	category: 'Shortest path',
	description: 'Find a finite shortest path even when some edges have negative weight.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'end', label: 'End', required: true }
	],
	execute: runBellmanFord
};

export const dagShortestPathDefinition: AnalysisDefinition = {
	id: 'dag-shortest-path',
	name: 'DAG Shortest Path',
	category: 'Shortest path',
	description: 'Find an optimal path through a directed acyclic graph in topological order.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'end', label: 'End', required: true }
	],
	execute: runDagShortestPath
};

export const aStarDefinition: AnalysisDefinition = {
	id: 'a-star',
	name: 'A* Shortest Path',
	category: 'Shortest path',
	description:
		'Uses a safely scaled straight-line estimate. It never overestimates the remaining cost, so the path stays optimal; when no safe scale is available, it uses zero and behaves like Dijkstra.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'end', label: 'End', required: true }
	],
	execute: runAStar
};

export const bidirectionalDijkstraDefinition: AnalysisDefinition = {
	id: 'bidirectional-dijkstra',
	name: 'Bidirectional Dijkstra',
	category: 'Shortest path',
	description: 'Find an optimal non-negative path with two cost-aware frontiers.',
	fields: [
		{ kind: 'node', id: 'start', label: 'Start', required: true },
		{ kind: 'node', id: 'end', label: 'End', required: true }
	],
	execute: runBidirectionalDijkstra
};

export const connectedComponentsDefinition: AnalysisDefinition = {
	id: 'connected-components',
	name: 'Connected Components',
	category: 'Connectivity',
	description: 'Group an undirected graph into its disconnected regions.',
	fields: [],
	execute: (snapshot) => runComponents(snapshot, 'connected')
};
export const weakComponentsDefinition: AnalysisDefinition = {
	id: 'weakly-connected-components',
	name: 'Weakly Connected Components',
	category: 'Connectivity',
	description: 'Group nodes while ignoring edge directions.',
	fields: [],
	execute: (snapshot) => runComponents(snapshot, 'weak')
};
export const strongComponentsDefinition: AnalysisDefinition = {
	id: 'strongly-connected-components',
	name: 'Strongly Connected Components',
	category: 'Connectivity',
	description: 'Group nodes that can mutually reach one another.',
	fields: [],
	execute: (snapshot) => runComponents(snapshot, 'strong')
};
export const bridgesDefinition: AnalysisDefinition = {
	id: 'bridges',
	name: 'Bridges',
	category: 'Connectivity',
	description: 'Find undirected edges whose removal disconnects the graph.',
	fields: [],
	execute: (snapshot) => runCriticality(snapshot, 'bridges')
};
export const articulationPointsDefinition: AnalysisDefinition = {
	id: 'articulation-points',
	name: 'Articulation Points',
	category: 'Connectivity',
	description: 'Find undirected nodes whose removal disconnects the graph.',
	fields: [],
	execute: (snapshot) => runCriticality(snapshot, 'articulation')
};

export const kruskalMstDefinition: AnalysisDefinition = {
	id: 'kruskal-mst',
	name: 'Kruskal Minimum Spanning Tree',
	category: 'MST',
	description: 'Build a minimum spanning tree by accepting the lightest non-cycling edges.',
	fields: [],
	execute: runKruskalMst
};
export const primMstDefinition: AnalysisDefinition = {
	id: 'prim-mst',
	name: 'Prim Minimum Spanning Tree',
	category: 'MST',
	description: 'Build a minimum spanning tree by growing from one deterministic node.',
	fields: [],
	execute: runPrimMst
};
export const topologicalSortDefinition: AnalysisDefinition = {
	id: 'topological-sort',
	name: 'Topological Sort',
	category: 'DAG',
	description: 'Order every node so each directed edge points forward.',
	fields: [],
	execute: runTopologicalSort
};
export const directedCycleDefinition: AnalysisDefinition = {
	id: 'directed-cycle-detection',
	name: 'Directed Cycle Detection',
	category: 'DAG',
	description: 'Find every node and edge participating in a directed cycle.',
	fields: [],
	execute: runDirectedCycleDetection
};
export const degreeCentralityDefinition: AnalysisDefinition = {
	id: 'degree-centrality',
	name: 'Degree Centrality',
	category: 'Centrality',
	description: 'Rank nodes by their incoming, outgoing, and total links.',
	fields: [],
	execute: runDegreeCentrality
};
export const pageRankDefinition: AnalysisDefinition = {
	id: 'pagerank',
	name: 'PageRank',
	category: 'Centrality',
	description:
		'Ranks link-based influence. Arrows direct influence; standard fixed damping and convergence defaults are used.',
	fields: [],
	execute: runPageRank
};
export const betweennessDefinition: AnalysisDefinition = {
	id: 'betweenness-centrality',
	name: 'Betweenness Centrality',
	category: 'Centrality',
	description: 'Ranks nodes by how often they lie on shortest routes between other nodes.',
	fields: [],
	execute: runBetweennessCentrality
};
export const bipartiteCheckDefinition: AnalysisDefinition = {
	id: 'bipartite-check',
	name: 'Bipartite Check',
	category: 'Coloring',
	description: 'Determine whether two conflict-free node colors suffice.',
	fields: [],
	execute: (snapshot) => runColoring(snapshot, 'bipartite')
};
export const greedyColoringDefinition: AnalysisDefinition = {
	id: 'greedy-coloring',
	name: 'Greedy Coloring',
	category: 'Coloring',
	description: 'Assign the lowest available color in stored node order.',
	fields: [],
	execute: (snapshot) => runColoring(snapshot, 'greedy')
};
export const welshPowellDefinition: AnalysisDefinition = {
	id: 'welsh-powell-coloring',
	name: 'Welsh-Powell Coloring',
	category: 'Coloring',
	description: 'Color highest-conflict nodes first with deterministic ties.',
	fields: [],
	execute: (snapshot) => runColoring(snapshot, 'welsh-powell')
};
export const dsaturDefinition: AnalysisDefinition = {
	id: 'dsatur-coloring',
	name: 'DSATUR Coloring',
	category: 'Coloring',
	description: 'Color the currently most constrained node first.',
	fields: [],
	execute: (snapshot) => runColoring(snapshot, 'dsatur')
};
export const hopcroftKarpDefinition: AnalysisDefinition = {
	id: 'hopcroft-karp',
	name: 'Hopcroft-Karp Matching',
	category: 'Matching',
	description: 'Find a maximum matching in a bipartite graph.',
	fields: [],
	execute: runHopcroftKarp
};
const flowFields: AnalysisDefinition['fields'] = [
	{ kind: 'node', id: 'source', label: 'Source', required: true },
	{ kind: 'node', id: 'sink', label: 'Sink', required: true }
];
export const fordFulkersonDefinition: AnalysisDefinition = {
	id: 'ford-fulkerson',
	name: 'Ford-Fulkerson Maximum Flow',
	category: 'Flow',
	description: 'Find maximum flow using deterministic depth-first augmenting paths.',
	fields: flowFields,
	execute: (snapshot, input) => runMaximumFlow(snapshot, input, 'dfs', 'Ford-Fulkerson')
};
export const edmondsKarpDefinition: AnalysisDefinition = {
	id: 'edmonds-karp',
	name: 'Edmonds-Karp Maximum Flow',
	category: 'Flow',
	description: 'Find maximum flow using breadth-first augmenting paths.',
	fields: flowFields,
	execute: (snapshot, input) => runMaximumFlow(snapshot, input, 'bfs', 'Edmonds-Karp')
};
export const dinicDefinition: AnalysisDefinition = {
	id: 'dinic-max-flow',
	name: 'Dinic Maximum Flow',
	category: 'Flow',
	description: 'Find maximum flow through level graphs and blocking flows.',
	fields: flowFields,
	execute: (snapshot, input) => runMaximumFlow(snapshot, input, 'dinic', 'Dinic')
};
export const minimumCutDefinition: AnalysisDefinition = {
	id: 'minimum-cut',
	name: 'Minimum Cut',
	category: 'Flow',
	description: 'Find the minimum-capacity Source-to-Sink cut and its two node sides.',
	fields: flowFields,
	execute: runMinimumCut
};
const exactRouteFields: AnalysisDefinition['fields'] = [
	{
		kind: 'enum',
		id: 'mode',
		label: 'Mode',
		options: [
			{ value: 'path', label: 'Path' },
			{ value: 'circuit', label: 'Circuit' }
		]
	},
	{ kind: 'node', id: 'start', label: 'Start' }
];
export const eulerianRouteDefinition: AnalysisDefinition = {
	id: 'eulerian-route',
	name: 'Eulerian Route',
	category: 'Exact routes',
	description: 'Find a path or circuit that uses every stored edge exactly once.',
	fields: exactRouteFields,
	execute: runEulerianRoute
};
export const hamiltonianRouteDefinition: AnalysisDefinition = {
	id: 'hamiltonian-route',
	name: 'Hamiltonian Route',
	category: 'Exact routes',
	description: 'Find an exact path or circuit that visits every node once, up to 20 nodes.',
	fields: exactRouteFields,
	execute: runHamiltonianRoute
};
export const maximumCliqueDefinition: AnalysisDefinition = {
	id: 'maximum-clique',
	name: 'Maximum Clique',
	category: 'Exact sets',
	description: 'Find one exact largest pairwise-adjacent node set, up to 20 nodes.',
	fields: [],
	execute: runMaximumClique
};
export const maximumIndependentSetDefinition: AnalysisDefinition = {
	id: 'maximum-independent-set',
	name: 'Maximum Independent Set',
	category: 'Exact sets',
	description: 'Find one exact largest mutually non-adjacent node set, up to 20 nodes.',
	fields: [],
	execute: runMaximumIndependentSet
};
export const minimumVertexCoverDefinition: AnalysisDefinition = {
	id: 'minimum-vertex-cover',
	name: 'Minimum Vertex Cover',
	category: 'Exact sets',
	description: 'Find one exact smallest node set that touches every edge, up to 20 nodes.',
	fields: [],
	execute: runMinimumVertexCover
};
export const nodeEccentricityDefinition: AnalysisDefinition = {
	id: 'node-eccentricity',
	name: 'Node Eccentricity',
	category: 'Graph metrics & structure',
	description: "Report every node's greatest unweighted hop distance.",
	fields: [],
	execute: runNodeEccentricity
};
export const graphDiameterDefinition: AnalysisDefinition = {
	id: 'graph-diameter',
	name: 'Graph Diameter',
	category: 'Graph metrics & structure',
	description: 'Find the greatest unweighted shortest-path distance and one witness path.',
	fields: [],
	execute: runGraphDiameter
};
export const graphRadiusDefinition: AnalysisDefinition = {
	id: 'graph-radius',
	name: 'Graph Radius',
	category: 'Graph metrics & structure',
	description: 'Report the minimum node eccentricity.',
	fields: [],
	execute: runGraphRadius
};
export const graphCenterDefinition: AnalysisDefinition = {
	id: 'graph-center',
	name: 'Graph Center',
	category: 'Graph metrics & structure',
	description: 'Identify every node whose eccentricity equals the graph radius.',
	fields: [],
	execute: runGraphCenter
};
export const graphGirthDefinition: AnalysisDefinition = {
	id: 'graph-girth',
	name: 'Graph Girth',
	category: 'Graph metrics & structure',
	description: 'Find the shortest cycle in an undirected multigraph.',
	fields: [],
	execute: runGraphGirth
};
export const graphDensityDefinition: AnalysisDefinition = {
	id: 'graph-density',
	name: 'Graph Density',
	category: 'Graph metrics & structure',
	description: 'Measure distinct non-loop adjacency against every possible adjacency.',
	fields: [],
	execute: runGraphDensity
};
export const degreeDistributionDefinition: AnalysisDefinition = {
	id: 'degree-distribution',
	name: 'Degree Distribution',
	category: 'Graph metrics & structure',
	description: 'Count how many nodes have each graph-theoretic degree.',
	fields: [],
	execute: runDegreeDistribution
};
export const treeForestDetectionDefinition: AnalysisDefinition = {
	id: 'tree-forest-detection',
	name: 'Tree/Forest Detection',
	category: 'Graph metrics & structure',
	description: 'Classify an undirected graph as a tree, forest, or neither.',
	fields: [],
	execute: runTreeForestDetection
};
export const louvainCommunityDefinition: AnalysisDefinition = {
	id: 'louvain-community-detection',
	name: 'Louvain Community Detection',
	category: 'Community detection',
	description:
		'Detect communities by maximizing weighted modularity. Requires undirected edges with finite nonnegative weights interpreted as connection strengths.',
	fields: [],
	execute: runLouvain
};
export const labelPropagationDefinition: AnalysisDefinition = {
	id: 'label-propagation',
	name: 'Label Propagation',
	category: 'Community detection',
	description:
		'Find communities by propagating the most common neighboring labels. Requires undirected edges with finite nonnegative weights interpreted as connection strengths.',
	fields: [],
	execute: runLabelPropagation
};
export const travelingSalesmanDefinition: AnalysisDefinition = {
	id: 'traveling-salesman',
	name: 'Traveling Salesman',
	category: 'Routing & optimization',
	description: 'Find the exact minimum-cost closed tour visiting every node once, up to 20 nodes.',
	fields: [],
	execute: runTravelingSalesman
};
export const chinesePostmanDefinition: AnalysisDefinition = {
	id: 'chinese-postman',
	name: 'Chinese Postman',
	category: 'Routing & optimization',
	description: 'Find a minimum-cost closed walk covering every undirected edge at least once.',
	fields: [],
	execute: runChinesePostman
};
export const planarityTestDefinition: AnalysisDefinition = {
	id: 'planarity-test',
	name: 'Planarity Test',
	category: 'Planarity',
	description: 'Determine whether the undirected graph admits a crossing-free embedding.',
	fields: [],
	execute: runPlanarityTest
};
export const planarEmbeddingDefinition: AnalysisDefinition = {
	id: 'planar-embedding',
	name: 'Planar Embedding',
	category: 'Planarity',
	description: 'Return the clockwise cyclic order of real edge incidences around every node.',
	fields: [],
	execute: runPlanarEmbedding
};

export const analysisDefinitions = new Map<string, AnalysisDefinition>([
	[bfsDefinition.id, bfsDefinition],
	[dfsDefinition.id, dfsDefinition],
	[depthLimitedDfsDefinition.id, depthLimitedDfsDefinition],
	[iddfsDefinition.id, iddfsDefinition],
	[randomWalkDefinition.id, randomWalkDefinition],
	[multiSourceBfsDefinition.id, multiSourceBfsDefinition],
	[bidirectionalBfsDefinition.id, bidirectionalBfsDefinition],
	[dijkstraDefinition.id, dijkstraDefinition],
	[zeroOneBfsDefinition.id, zeroOneBfsDefinition],
	[bellmanFordDefinition.id, bellmanFordDefinition],
	[dagShortestPathDefinition.id, dagShortestPathDefinition],
	[aStarDefinition.id, aStarDefinition],
	[bidirectionalDijkstraDefinition.id, bidirectionalDijkstraDefinition],
	[connectedComponentsDefinition.id, connectedComponentsDefinition],
	[weakComponentsDefinition.id, weakComponentsDefinition],
	[strongComponentsDefinition.id, strongComponentsDefinition],
	[bridgesDefinition.id, bridgesDefinition],
	[articulationPointsDefinition.id, articulationPointsDefinition],
	[kruskalMstDefinition.id, kruskalMstDefinition],
	[primMstDefinition.id, primMstDefinition],
	[topologicalSortDefinition.id, topologicalSortDefinition],
	[directedCycleDefinition.id, directedCycleDefinition],
	[degreeCentralityDefinition.id, degreeCentralityDefinition],
	[pageRankDefinition.id, pageRankDefinition],
	[betweennessDefinition.id, betweennessDefinition],
	[bipartiteCheckDefinition.id, bipartiteCheckDefinition],
	[greedyColoringDefinition.id, greedyColoringDefinition],
	[welshPowellDefinition.id, welshPowellDefinition],
	[dsaturDefinition.id, dsaturDefinition],
	[hopcroftKarpDefinition.id, hopcroftKarpDefinition],
	[fordFulkersonDefinition.id, fordFulkersonDefinition],
	[edmondsKarpDefinition.id, edmondsKarpDefinition],
	[dinicDefinition.id, dinicDefinition],
	[minimumCutDefinition.id, minimumCutDefinition],
	[eulerianRouteDefinition.id, eulerianRouteDefinition],
	[hamiltonianRouteDefinition.id, hamiltonianRouteDefinition],
	[maximumCliqueDefinition.id, maximumCliqueDefinition],
	[maximumIndependentSetDefinition.id, maximumIndependentSetDefinition],
	[minimumVertexCoverDefinition.id, minimumVertexCoverDefinition],
	[nodeEccentricityDefinition.id, nodeEccentricityDefinition],
	[graphDiameterDefinition.id, graphDiameterDefinition],
	[graphRadiusDefinition.id, graphRadiusDefinition],
	[graphCenterDefinition.id, graphCenterDefinition],
	[graphGirthDefinition.id, graphGirthDefinition],
	[graphDensityDefinition.id, graphDensityDefinition],
	[degreeDistributionDefinition.id, degreeDistributionDefinition],
	[treeForestDetectionDefinition.id, treeForestDetectionDefinition],
	[louvainCommunityDefinition.id, louvainCommunityDefinition],
	[labelPropagationDefinition.id, labelPropagationDefinition],
	[travelingSalesmanDefinition.id, travelingSalesmanDefinition],
	[chinesePostmanDefinition.id, chinesePostmanDefinition],
	[planarityTestDefinition.id, planarityTestDefinition],
	[planarEmbeddingDefinition.id, planarEmbeddingDefinition]
]);
