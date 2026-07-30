import type { EdgeId, GraphDocument, GraphEdge, GraphNode, NodeId } from '../model/types';

export type NodePatch = Partial<Omit<GraphNode, 'id'>>;
export type EdgePatch = Partial<Omit<GraphEdge, 'id'>>;

export interface AddEdgeInput {
	from: NodeId;
	to: NodeId;
	directed?: boolean;
	weight?: number;
	label?: string;
}

/** Bump `updatedAt` to now. */
export function touch(doc: GraphDocument): GraphDocument {
	return { ...doc, updatedAt: new Date().toISOString() };
}

function assertNodeExists(doc: GraphDocument, id: NodeId): void {
	if (!(id in doc.nodes)) {
		throw new Error(`Node not found: ${id}`);
	}
}

function assertEdgeExists(doc: GraphDocument, id: EdgeId): void {
	if (!(id in doc.edges)) {
		throw new Error(`Edge not found: ${id}`);
	}
}

/**
 * Add a node with defaults: label `Node`, position origin, unpinned, empty tags/attachments/data.
 */
export function addNode(
	doc: GraphDocument,
	partial: NodePatch = {}
): { doc: GraphDocument; nodeId: NodeId } {
	const nodeId = crypto.randomUUID();
	const node: GraphNode = {
		id: nodeId,
		label: partial.label ?? 'Node',
		position: partial.position ?? { x: 0, y: 0, z: 0 },
		pinned: partial.pinned ?? false,
		tags: partial.tags ?? [],
		attachments: partial.attachments ?? [],
		data: partial.data ?? {},
		...(partial.groupId !== undefined ? { groupId: partial.groupId } : {}),
		...(partial.weight !== undefined ? { weight: partial.weight } : {}),
		...(partial.notes !== undefined ? { notes: partial.notes } : {})
	};
	return {
		doc: touch({
			...doc,
			nodes: { ...doc.nodes, [nodeId]: node }
		}),
		nodeId
	};
}

/** Merge a patch into an existing node. */
export function updateNode(doc: GraphDocument, id: NodeId, patch: NodePatch): GraphDocument {
	assertNodeExists(doc, id);
	const prev = doc.nodes[id];
	const next: GraphNode = {
		...prev,
		...patch,
		id,
		position: patch.position ? { ...prev.position, ...patch.position } : prev.position,
		tags: patch.tags ?? prev.tags,
		attachments: patch.attachments ?? prev.attachments,
		data: patch.data ?? prev.data
	};
	return touch({
		...doc,
		nodes: { ...doc.nodes, [id]: next }
	});
}

/** Remove a node and every incident edge. */
export function removeNode(doc: GraphDocument, id: NodeId): GraphDocument {
	assertNodeExists(doc, id);
	const { [id]: _removed, ...nodes } = doc.nodes;
	const edges: GraphDocument['edges'] = {};
	for (const [edgeId, edge] of Object.entries(doc.edges)) {
		if (edge.from !== id && edge.to !== id) {
			edges[edgeId] = edge;
		}
	}
	return touch({ ...doc, nodes, edges });
}

/**
 * Add an edge between existing endpoints.
 * Defaults: undirected, weight 1, empty attachments/data.
 */
export function addEdge(
	doc: GraphDocument,
	input: AddEdgeInput
): { doc: GraphDocument; edgeId: EdgeId } {
	assertNodeExists(doc, input.from);
	assertNodeExists(doc, input.to);
	const edgeId = crypto.randomUUID();
	const edge: GraphEdge = {
		id: edgeId,
		from: input.from,
		to: input.to,
		directed: input.directed ?? false,
		weight: input.weight ?? 1,
		attachments: [],
		data: {},
		...(input.label !== undefined ? { label: input.label } : {})
	};
	return {
		doc: touch({
			...doc,
			edges: { ...doc.edges, [edgeId]: edge }
		}),
		edgeId
	};
}

/** Merge a patch into an existing edge (cannot retarget missing endpoints). */
export function updateEdge(doc: GraphDocument, id: EdgeId, patch: EdgePatch): GraphDocument {
	assertEdgeExists(doc, id);
	const prev = doc.edges[id];
	const from = patch.from ?? prev.from;
	const to = patch.to ?? prev.to;
	assertNodeExists(doc, from);
	assertNodeExists(doc, to);
	const next: GraphEdge = {
		...prev,
		...patch,
		id,
		from,
		to,
		attachments: patch.attachments ?? prev.attachments,
		data: patch.data ?? prev.data
	};
	return touch({
		...doc,
		edges: { ...doc.edges, [id]: next }
	});
}

export function removeEdge(doc: GraphDocument, id: EdgeId): GraphDocument {
	assertEdgeExists(doc, id);
	const { [id]: _removed, ...edges } = doc.edges;
	return touch({ ...doc, edges });
}
