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

function runIddfs(snapshot: GraphDocument, input: AnalysisInput): AnalysisOutput {
	const phases: NonNullable<AnalysisOutput['result']['reveal']>['phases'] = [];
	const events: AnalysisEvent[] = [];
	const maximumSimpleDepth = Math.max(0, Object.keys(snapshot.nodes).length - 1);
	let finalOutput: AnalysisOutput | null = null;
	let finalDepth = 0;
	for (let depth = 0; depth <= maximumSimpleDepth; depth += 1) {
		if (depth > 0) event(events, 'restart-depth', { depth });
		const iteration = runDepthLimitedDfs(snapshot, { ...input, maxDepth: depth });
		for (const item of iteration.events) events.push({ ...item, sequence: events.length });
		const iterationSteps = iteration.result.reveal?.phases[0]?.steps ?? [];
		phases.push({
			id: `depth-${depth}`,
			steps: [
				...(depth > 0 ? [{ actions: [{ kind: 'reset-footprint' as const }] }] : []),
				...iterationSteps
			]
		});
		finalOutput = iteration;
		finalDepth = depth;
		const found = iteration.result.outcome === 'complete' && input.mode === 'search';
		const cutOff = iteration.events.some((item) => item.action === 'cutoff');
		if (found || !cutOff) break;
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
			reveal: { phases }
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
	if (path) steps.push({ actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }] });
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
			reveal: { phases: [{ id: 'combined', steps }] }
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
			{ inspector: 'start-predecessors', operation: 'reset', kind: 'map', value: {} },
			{ inspector: 'target-predecessors', operation: 'reset', kind: 'map', value: {} }
		]
	);
	while (!meeting && startFrontier.length && targetFrontier.length) {
		const nextStart: string[] = [];
		const nextTarget: string[] = [];
		const waveActions: AnalysisRevealStep['actions'] = [];
		for (const current of startFrontier) {
			event(events, 'expand-start-frontier', { nodeId: current });
			for (const neighbor of neighborsOf(snapshot, current)) {
				if (startDepth.has(neighbor.nodeId)) continue;
				startDepth.set(neighbor.nodeId, (startDepth.get(current) ?? 0) + 1);
				startParent.set(neighbor.nodeId, { prev: current, edgeId: neighbor.edgeId });
				nextStart.push(neighbor.nodeId);
				waveActions.push(
					{ kind: 'reveal-edge', edgeId: neighbor.edgeId, role: 'start-side' },
					{ kind: 'reveal-node', nodeId: neighbor.nodeId, role: 'start-side' }
				);
				event(events, 'discover-start-side', {
					nodeId: neighbor.nodeId,
					edgeId: neighbor.edgeId
				});
			}
		}
		for (const current of targetFrontier) {
			event(events, 'expand-target-frontier', { nodeId: current });
			for (const neighbor of incomingNeighborsOf(snapshot, current)) {
				if (targetDepth.has(neighbor.nodeId)) continue;
				targetDepth.set(neighbor.nodeId, (targetDepth.get(current) ?? 0) + 1);
				targetParent.set(neighbor.nodeId, { next: current, edgeId: neighbor.edgeId });
				nextTarget.push(neighbor.nodeId);
				waveActions.push(
					{ kind: 'reveal-edge', edgeId: neighbor.edgeId, role: 'target-side' },
					{ kind: 'reveal-node', nodeId: neighbor.nodeId, role: 'target-side' }
				);
				event(events, 'discover-target-side', {
					nodeId: neighbor.nodeId,
					edgeId: neighbor.edgeId
				});
			}
		}
		if (waveActions.length) steps.push({ actions: waveActions });
		const candidates = [...startDepth.keys()].filter((id) => targetDepth.has(id));
		candidates.sort(
			(a, b) =>
				startDepth.get(a)! + targetDepth.get(a)! - (startDepth.get(b)! + targetDepth.get(b)!) ||
				[...startDepth.keys()].indexOf(a) - [...startDepth.keys()].indexOf(b)
		);
		meeting = candidates[0];
		startFrontier = nextStart;
		targetFrontier = nextTarget;
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
		steps.push({ actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }] });
		event(events, 'frontiers-meet', { nodeId: meeting! });
	}
	const exploredNodes = [...new Set([...startDepth.keys(), ...targetDepth.keys()])];
	const exploredEdges = [
		...startParent.values().map((item) => item.edgeId),
		...targetParent.values().map((item) => item.edgeId)
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
			reveal: { phases: [{ id: 'bidirectional', steps }] }
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
	[iddfsDefinition.id, iddfsDefinition],
	[multiSourceBfsDefinition.id, multiSourceBfsDefinition],
	[bidirectionalBfsDefinition.id, bidirectionalBfsDefinition],
	[dijkstraDefinition.id, dijkstraDefinition]
]);
