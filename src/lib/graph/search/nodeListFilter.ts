import type { GraphNode } from '../model/types';

/**
 * Whether a node should appear in the Nodes list given a text query and tag chips.
 * Empty query and no tags → match all. Otherwise match if the query hits label/id
 * **or** the node has any of the selected tags (OR).
 */
export function nodeMatchesListFilter(
	node: Pick<GraphNode, 'id' | 'label' | 'tags'>,
	query: string,
	tags: string[]
): boolean {
	const q = query.trim().toLowerCase();
	const hasQuery = q.length > 0;
	const hasTags = tags.length > 0;
	if (!hasQuery && !hasTags) return true;

	const textMatch =
		hasQuery && (node.label.toLowerCase().includes(q) || node.id.toLowerCase().startsWith(q));
	const tagMatch = hasTags && tags.some((t) => node.tags.includes(t));
	return Boolean(textMatch || tagMatch);
}
