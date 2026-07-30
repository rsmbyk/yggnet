import type { GraphDocument, NodeId } from '../model/types';
import { neighborsOf, type GraphPath } from './adjacency';

export interface PathSearchOptions {
	maxPaths?: number;
	maxDepth?: number;
}

/**
 * Enumerate simple (no repeated nodes) paths from `from` to `to`.
 * Caps results with maxPaths (default 50) and maxDepth (default 20).
 */
export function findAllSimplePaths(
	doc: GraphDocument,
	from: NodeId,
	to: NodeId,
	options: PathSearchOptions = {}
): GraphPath[] {
	const maxPaths = options.maxPaths ?? 50;
	const maxDepth = options.maxDepth ?? 20;
	const results: GraphPath[] = [];

	if (!(from in doc.nodes) || !(to in doc.nodes)) {
		return results;
	}

	const pathNodes: string[] = [from];
	const pathEdges: string[] = [];
	const onPath = new Set<string>([from]);

	function dfs(depth: number): void {
		if (results.length >= maxPaths) return;
		const u = pathNodes[pathNodes.length - 1];
		if (u === to) {
			results.push({ nodeIds: [...pathNodes], edgeIds: [...pathEdges] });
			return;
		}
		if (depth >= maxDepth) return;

		for (const n of neighborsOf(doc, u)) {
			if (onPath.has(n.nodeId)) continue;
			pathNodes.push(n.nodeId);
			pathEdges.push(n.edgeId);
			onPath.add(n.nodeId);
			dfs(depth + 1);
			onPath.delete(n.nodeId);
			pathNodes.pop();
			pathEdges.pop();
			if (results.length >= maxPaths) return;
		}
	}

	dfs(0);
	return results;
}

/**
 * All shortest paths by hop count (BFS layers). Ties included.
 * For weighted shortest path, use Dijkstra via the algorithm registry.
 */
export function findShortestPaths(doc: GraphDocument, from: NodeId, to: NodeId): GraphPath[] {
	if (!(from in doc.nodes) || !(to in doc.nodes)) {
		return [];
	}
	if (from === to) {
		return [{ nodeIds: [from], edgeIds: [] }];
	}

	const dist = new Map<string, number>();
	const parents = new Map<string, { prev: string; edgeId: string }[]>();
	const queue: string[] = [from];
	dist.set(from, 0);

	while (queue.length > 0) {
		const u = queue.shift()!;
		const du = dist.get(u)!;
		// Parents of `to` come from layer dist[to]-1; do not expand from the target layer onward.
		if (dist.has(to) && du >= dist.get(to)!) {
			continue;
		}
		for (const n of neighborsOf(doc, u)) {
			const nd = du + 1;
			if (!dist.has(n.nodeId)) {
				dist.set(n.nodeId, nd);
				parents.set(n.nodeId, [{ prev: u, edgeId: n.edgeId }]);
				queue.push(n.nodeId);
			} else if (dist.get(n.nodeId) === nd) {
				parents.get(n.nodeId)!.push({ prev: u, edgeId: n.edgeId });
			}
		}
	}

	if (!dist.has(to)) {
		return [];
	}

	const results: GraphPath[] = [];

	function rebuild(node: string, nodes: string[], edges: string[]): void {
		if (node === from) {
			results.push({ nodeIds: [from, ...nodes], edgeIds: [...edges] });
			return;
		}
		const pars = parents.get(node);
		if (!pars) return;
		for (const p of pars) {
			rebuild(p.prev, [node, ...nodes], [p.edgeId, ...edges]);
		}
	}

	rebuild(to, [], []);
	return results;
}
