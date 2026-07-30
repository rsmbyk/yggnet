import type { GraphDocument, GraphEdge, NodeId } from '../model/types';

export interface Neighbor {
	nodeId: NodeId;
	edgeId: string;
	weight: number;
	edge: GraphEdge;
}

/** Outgoing neighbors respecting directed vs undirected edges. */
export function neighborsOf(doc: GraphDocument, nodeId: NodeId): Neighbor[] {
	const out: Neighbor[] = [];
	for (const edge of Object.values(doc.edges)) {
		if (edge.from === nodeId) {
			out.push({ nodeId: edge.to, edgeId: edge.id, weight: edge.weight, edge });
		} else if (!edge.directed && edge.to === nodeId) {
			out.push({ nodeId: edge.from, edgeId: edge.id, weight: edge.weight, edge });
		}
	}
	return out;
}

export function euclidean3d(
	a: { x: number; y: number; z: number },
	b: { x: number; y: number; z: number }
): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	const dz = a.z - b.z;
	return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export interface GraphPath {
	nodeIds: string[];
	edgeIds: string[];
}

export function reconstructPath(
	cameFrom: Map<string, { prev: string; edgeId: string }>,
	from: string,
	to: string
): GraphPath | null {
	if (from === to) {
		return { nodeIds: [from], edgeIds: [] };
	}
	if (!cameFrom.has(to)) {
		return null;
	}
	const nodeIds: string[] = [];
	const edgeIds: string[] = [];
	let cur: string | undefined = to;
	while (cur !== undefined && cur !== from) {
		nodeIds.push(cur);
		const step = cameFrom.get(cur);
		if (!step) return null;
		edgeIds.push(step.edgeId);
		cur = step.prev;
	}
	if (cur !== from) return null;
	nodeIds.push(from);
	nodeIds.reverse();
	edgeIds.reverse();
	return { nodeIds, edgeIds };
}
