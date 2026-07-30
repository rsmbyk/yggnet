import type { GraphDocument } from '../model/types';
import type { AlgorithmOutput, AlgorithmResult, TraceEvent } from './types';
import { neighborsOf, reconstructPath, euclidean3d } from './adjacency';

export interface PathParams {
	from: string;
	to: string;
}

function startDone(algorithmId: string, result: AlgorithmResult, mid: TraceEvent[]): AlgorithmOutput {
	return {
		result,
		trace: [{ type: 'start', algorithmId }, ...mid, { type: 'done', result }]
	};
}

/** Unweighted BFS shortest path (by hop count). */
export function runBfs(snapshot: GraphDocument, params: PathParams): AlgorithmOutput {
	const { from, to } = params;
	const mid: TraceEvent[] = [];
	if (!(from in snapshot.nodes) || !(to in snapshot.nodes)) {
		const result: AlgorithmResult = { kind: 'empty' };
		return startDone('bfs', result, mid);
	}
	if (from === to) {
		mid.push({ type: 'visit', nodeId: from });
		const result: AlgorithmResult = { kind: 'path', nodeIds: [from], edgeIds: [] };
		return startDone('bfs', result, mid);
	}

	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const visited = new Set<string>([from]);
	const queue: string[] = [from];
	mid.push({ type: 'visit', nodeId: from });

	while (queue.length > 0) {
		const u = queue.shift()!;
		for (const n of neighborsOf(snapshot, u)) {
			mid.push({
				type: 'relax',
				edgeId: n.edgeId,
				from: u,
				to: n.nodeId,
				meta: { weight: n.weight }
			});
			if (visited.has(n.nodeId)) continue;
			visited.add(n.nodeId);
			cameFrom.set(n.nodeId, { prev: u, edgeId: n.edgeId });
			mid.push({ type: 'visit', nodeId: n.nodeId });
			if (n.nodeId === to) {
				const path = reconstructPath(cameFrom, from, to)!;
				const result: AlgorithmResult = { kind: 'path', ...path };
				return startDone('bfs', result, mid);
			}
			queue.push(n.nodeId);
		}
	}

	const result: AlgorithmResult = { kind: 'empty' };
	return startDone('bfs', result, mid);
}

/** Dijkstra shortest path by edge.weight. */
export function runDijkstra(snapshot: GraphDocument, params: PathParams): AlgorithmOutput {
	const { from, to } = params;
	const mid: TraceEvent[] = [];
	if (!(from in snapshot.nodes) || !(to in snapshot.nodes)) {
		return startDone('dijkstra', { kind: 'empty' }, mid);
	}
	if (from === to) {
		mid.push({ type: 'visit', nodeId: from });
		return startDone('dijkstra', { kind: 'path', nodeIds: [from], edgeIds: [] }, mid);
	}

	const dist = new Map<string, number>();
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const settled = new Set<string>();

	for (const id of Object.keys(snapshot.nodes)) {
		dist.set(id, Infinity);
	}
	dist.set(from, 0);
	mid.push({ type: 'visit', nodeId: from, meta: { dist: 0 } });

	while (settled.size < Object.keys(snapshot.nodes).length) {
		let u: string | null = null;
		let best = Infinity;
		for (const [id, d] of dist) {
			if (!settled.has(id) && d < best) {
				best = d;
				u = id;
			}
		}
		if (u === null || best === Infinity) break;
		settled.add(u);
		if (u !== from) {
			mid.push({ type: 'visit', nodeId: u, meta: { dist: best } });
		}
		if (u === to) break;

		for (const n of neighborsOf(snapshot, u)) {
			const alt = best + n.weight;
			mid.push({
				type: 'relax',
				edgeId: n.edgeId,
				from: u,
				to: n.nodeId,
				meta: { weight: n.weight, alt }
			});
			if (alt < (dist.get(n.nodeId) ?? Infinity)) {
				dist.set(n.nodeId, alt);
				cameFrom.set(n.nodeId, { prev: u, edgeId: n.edgeId });
			}
		}
	}

	const path = reconstructPath(cameFrom, from, to);
	if (!path || (dist.get(to) ?? Infinity) === Infinity) {
		return startDone('dijkstra', { kind: 'empty' }, mid);
	}
	return startDone('dijkstra', { kind: 'path', ...path }, mid);
}

/** A* shortest path; heuristic = Euclidean 3D between node positions. */
export function runAstar(snapshot: GraphDocument, params: PathParams): AlgorithmOutput {
	const { from, to } = params;
	const mid: TraceEvent[] = [];
	if (!(from in snapshot.nodes) || !(to in snapshot.nodes)) {
		return startDone('astar', { kind: 'empty' }, mid);
	}
	if (from === to) {
		mid.push({ type: 'visit', nodeId: from });
		return startDone('astar', { kind: 'path', nodeIds: [from], edgeIds: [] }, mid);
	}

	const goalPos = snapshot.nodes[to].position;
	const h = (id: string) => euclidean3d(snapshot.nodes[id].position, goalPos);

	const gScore = new Map<string, number>();
	const fScore = new Map<string, number>();
	const cameFrom = new Map<string, { prev: string; edgeId: string }>();
	const closed = new Set<string>();
	const open = new Set<string>([from]);

	for (const id of Object.keys(snapshot.nodes)) {
		gScore.set(id, Infinity);
		fScore.set(id, Infinity);
	}
	gScore.set(from, 0);
	fScore.set(from, h(from));
	mid.push({ type: 'visit', nodeId: from, meta: { g: 0, f: fScore.get(from) } });

	while (open.size > 0) {
		let u: string | null = null;
		let bestF = Infinity;
		for (const id of open) {
			const f = fScore.get(id) ?? Infinity;
			if (f < bestF) {
				bestF = f;
				u = id;
			}
		}
		if (u === null) break;
		if (u === to) {
			const path = reconstructPath(cameFrom, from, to)!;
			return startDone('astar', { kind: 'path', ...path }, mid);
		}
		open.delete(u);
		closed.add(u);
		if (u !== from) {
			mid.push({
				type: 'visit',
				nodeId: u,
				meta: { g: gScore.get(u), f: fScore.get(u) }
			});
		}

		const gU = gScore.get(u) ?? Infinity;
		for (const n of neighborsOf(snapshot, u)) {
			if (closed.has(n.nodeId)) {
				mid.push({
					type: 'relax',
					edgeId: n.edgeId,
					from: u,
					to: n.nodeId,
					meta: { weight: n.weight, skipped: true }
				});
				continue;
			}
			const tentative = gU + n.weight;
			mid.push({
				type: 'relax',
				edgeId: n.edgeId,
				from: u,
				to: n.nodeId,
				meta: { weight: n.weight, tentative }
			});
			if (tentative < (gScore.get(n.nodeId) ?? Infinity)) {
				cameFrom.set(n.nodeId, { prev: u, edgeId: n.edgeId });
				gScore.set(n.nodeId, tentative);
				fScore.set(n.nodeId, tentative + h(n.nodeId));
				open.add(n.nodeId);
			}
		}
	}

	return startDone('astar', { kind: 'empty' }, mid);
}
