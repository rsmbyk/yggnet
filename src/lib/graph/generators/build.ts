import { createEmptyDocument } from '../model/document';
import type { GraphDocument, GraphEdge, GraphNode } from '../model/types';
import type { Vec3 } from './geom';
import type { Rng } from './rng';
import { MAX_GRAPH_NODES } from './types';

export function clampInt(n: number, min: number, max: number): number {
	if (!Number.isFinite(n)) return min;
	return Math.max(min, Math.min(max, Math.round(n)));
}

export function clampNodes(n: number, min = 1): number {
	return clampInt(n, min, MAX_GRAPH_NODES);
}

export type EdgeSpec = {
	from: number;
	to: number;
	directed?: boolean;
};

/**
 * Build a document from index-based points and edges.
 * Node ids are `g0`… so a seed fully determines the document structure.
 */
export function assemble(
	title: string,
	points: Vec3[],
	edges: EdgeSpec[],
	rng: Rng,
	opts: { nodeY?: number; weighted?: boolean; directed?: boolean } = {}
): GraphDocument {
	const nodeY = opts.nodeY ?? 0;
	const directedDefault = opts.directed ?? false;
	const now = new Date().toISOString();
	const nodes: Record<string, GraphNode> = {};
	for (let i = 0; i < points.length; i += 1) {
		const id = `g${i}`;
		nodes[id] = {
			id,
			label: `N${i + 1}`,
			position: { x: points[i].x, y: points[i].y + nodeY, z: points[i].z },
			pinned: false,
			tags: [],
			attachments: [],
			data: {}
		};
	}
	const graphEdges: Record<string, GraphEdge> = {};
	for (let i = 0; i < edges.length; i += 1) {
		const e = edges[i];
		const id = `e${i}`;
		graphEdges[id] = {
			id,
			from: `g${e.from}`,
			to: `g${e.to}`,
			directed: e.directed ?? directedDefault,
			weight: opts.weighted ? rng.int(1, 9) : 1,
			attachments: [],
			data: {}
		};
	}
	const empty = createEmptyDocument(title);
	return {
		...empty,
		title,
		createdAt: now,
		updatedAt: now,
		nodes,
		edges: graphEdges
	};
}

export function undirected(pairs: Array<[number, number]>): EdgeSpec[] {
	return pairs.map(([from, to]) => ({ from, to, directed: false }));
}

export function directed(pairs: Array<[number, number]>): EdgeSpec[] {
	return pairs.map(([from, to]) => ({ from, to, directed: true }));
}
