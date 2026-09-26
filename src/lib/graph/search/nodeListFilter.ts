import type { GraphNode, NodeId } from '../model/types';

/**
 * Whether a node should appear in the Nodes list given selected node chips and tag chips.
 * Empty nodeIds and tags → match all. Otherwise match if the node id is selected
 * **or** the node has any of the selected tags (OR). Query text is not used for matching
 * (it only filters the dropdown suggestions).
 */
export function nodeMatchesListFilter(
	node: Pick<GraphNode, 'id' | 'tags'>,
	nodeIds: NodeId[],
	tags: string[]
): boolean {
	const hasNodes = nodeIds.length > 0;
	const hasTags = tags.length > 0;
	if (!hasNodes && !hasTags) return true;

	const nodeMatch = hasNodes && nodeIds.includes(node.id);
	const tagMatch = hasTags && tags.some((t) => node.tags.includes(t));
	return Boolean(nodeMatch || tagMatch);
}
