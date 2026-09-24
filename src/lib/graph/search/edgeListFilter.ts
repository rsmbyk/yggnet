import type { GraphEdge, GraphNode, NodeId } from '../model/types';

/**
 * Whether an edge should appear in the Edges list given a text query and tag chips.
 * Empty query and no tags → match all. Otherwise match if the query hits an endpoint
 * label/id or the edge id, **or** the edge has any of the selected tags (OR).
 */
export function edgeMatchesListFilter(
	edge: Pick<GraphEdge, 'id' | 'from' | 'to' | 'tags'>,
	nodesById: Record<NodeId, Pick<GraphNode, 'id' | 'label'>>,
	query: string,
	tags: string[]
): boolean {
	const q = query.trim().toLowerCase();
	const hasQuery = q.length > 0;
	const hasTags = tags.length > 0;
	if (!hasQuery && !hasTags) return true;

	const from = nodesById[edge.from];
	const to = nodesById[edge.to];
	const textMatch =
		hasQuery &&
		(edge.id.toLowerCase().startsWith(q) ||
			(from
				? from.label.toLowerCase().includes(q) || from.id.toLowerCase().startsWith(q)
				: false) ||
			(to ? to.label.toLowerCase().includes(q) || to.id.toLowerCase().startsWith(q) : false));
	const edgeTags = edge.tags ?? [];
	const tagMatch = hasTags && tags.some((t) => edgeTags.includes(t));
	return Boolean(textMatch || tagMatch);
}
