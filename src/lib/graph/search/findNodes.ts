import type { GraphDocument, NodeId } from '../model/types';

/** Match nodes whose label contains the query or whose id starts with it (case-insensitive). */
export function findNodesByQuery(doc: GraphDocument, query: string): NodeId[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return Object.values(doc.nodes)
		.filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().startsWith(q))
		.map((n) => n.id);
}

export function findNodeByQuery(doc: GraphDocument, query: string): NodeId | null {
	return findNodesByQuery(doc, query)[0] ?? null;
}
