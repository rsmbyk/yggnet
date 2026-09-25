import type { GraphEdge, NodeId } from '../model/types';

/**
 * Whether an edge should appear in the Edges list given selected endpoint nodes and tag chips.
 * Empty nodeIds and tags → match all. Otherwise match if either endpoint is a selected node
 * **or** the edge has any of the selected tags (OR). Query text is not used for matching.
 */
export function edgeMatchesListFilter(
	edge: Pick<GraphEdge, 'from' | 'to' | 'tags'>,
	nodeIds: NodeId[],
	tags: string[]
): boolean {
	const hasNodes = nodeIds.length > 0;
	const hasTags = tags.length > 0;
	if (!hasNodes && !hasTags) return true;

	const nodeMatch = hasNodes && (nodeIds.includes(edge.from) || nodeIds.includes(edge.to));
	const edgeTags = edge.tags ?? [];
	const tagMatch = hasTags && tags.some((t) => edgeTags.includes(t));
	return Boolean(nodeMatch || tagMatch);
}
