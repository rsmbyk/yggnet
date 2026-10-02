import type { GraphNode } from '../model/types';

/**
 * Whether a node should appear in the Nodes list given selected tag chips and
 * an optional label keyword. Empty tags and keyword → match all. Otherwise the
 * node must satisfy the tag rule (any selected tag) AND contain the keyword
 * (case-insensitive substring) when one is set. Query text is not used for
 * matching (it only filters the dropdown suggestions).
 */
export function nodeMatchesListFilter(
	node: Pick<GraphNode, 'id' | 'label' | 'tags'>,
	tags: string[],
	keyword: string
): boolean {
	const hasTags = tags.length > 0;
	const q = keyword.trim().toLowerCase();
	if (!hasTags && !q) return true;

	const tagMatch = !hasTags || tags.some((t) => node.tags.includes(t));
	const keywordMatch = !q || node.label.toLowerCase().includes(q);
	return Boolean(tagMatch && keywordMatch);
}
