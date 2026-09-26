import type { GraphDocument } from './model/types';

/** Valid tag: non-empty alphanumeric + hyphen only. */
export const TAG_PATTERN = /^[a-zA-Z0-9-]+$/;

export function isValidTag(tag: string): boolean {
	return TAG_PATTERN.test(tag);
}

/** Trim, drop empties/invalids, dedupe (first wins). Silent strip. */
export function normalizeTags(tags: string[] | undefined | null): string[] {
	if (!tags?.length) return [];
	const seen = new Set<string>();
	const out: string[] = [];
	for (const raw of tags) {
		const t = typeof raw === 'string' ? raw.trim() : '';
		if (!t || !isValidTag(t) || seen.has(t)) continue;
		seen.add(t);
		out.push(t);
	}
	return out;
}

export type TagUsage = {
	tag: string;
	nodeCount: number;
	edgeCount: number;
};

/** Union of all tags on nodes and edges, with usage counts. */
export function collectTagUsage(doc: GraphDocument): TagUsage[] {
	const map = new Map<string, TagUsage>();
	const bump = (tag: string, kind: 'node' | 'edge') => {
		let row = map.get(tag);
		if (!row) {
			row = { tag, nodeCount: 0, edgeCount: 0 };
			map.set(tag, row);
		}
		if (kind === 'node') row.nodeCount += 1;
		else row.edgeCount += 1;
	};
	for (const node of Object.values(doc.nodes)) {
		for (const t of node.tags ?? []) {
			if (isValidTag(t)) bump(t, 'node');
		}
	}
	for (const edge of Object.values(doc.edges)) {
		for (const t of edge.tags ?? []) {
			if (isValidTag(t)) bump(t, 'edge');
		}
	}
	return [...map.values()].sort((a, b) => {
		if (b.nodeCount !== a.nodeCount) return b.nodeCount - a.nodeCount;
		if (b.edgeCount !== a.edgeCount) return b.edgeCount - a.edgeCount;
		return a.tag.localeCompare(b.tag);
	});
}

/** Sorted unique tag labels in the document. */
export function collectDocumentTags(doc: GraphDocument): string[] {
	return collectTagUsage(doc).map((u) => u.tag);
}

/**
 * Rename every occurrence of `from` to `to`.
 * Throws if `to` is invalid or already exists as a different tag.
 * No-op (returns same doc) when from === to.
 */
export function renameTag(doc: GraphDocument, from: string, to: string): GraphDocument {
	if (from === to) return doc;
	if (!isValidTag(to)) {
		throw new Error(`Invalid tag: ${to}`);
	}
	const existing = new Set(collectDocumentTags(doc));
	if (existing.has(to)) {
		throw new Error(`Tag already exists: ${to}`);
	}
	const rewrite = (tags: string[]) => normalizeTags(tags.map((t) => (t === from ? to : t)));

	let changed = false;
	const nodes = { ...doc.nodes };
	for (const [id, node] of Object.entries(nodes)) {
		const tags = node.tags ?? [];
		if (!tags.includes(from)) continue;
		nodes[id] = { ...node, tags: rewrite(tags) };
		changed = true;
	}
	const edges = { ...doc.edges };
	for (const [id, edge] of Object.entries(edges)) {
		const tags = edge.tags ?? [];
		if (!tags.includes(from)) continue;
		edges[id] = { ...edge, tags: rewrite(tags) };
		changed = true;
	}
	if (!changed) return doc;
	return {
		...doc,
		nodes,
		edges,
		updatedAt: new Date().toISOString()
	};
}

/** Remove `tag` from every node and edge. */
export function deleteTag(doc: GraphDocument, tag: string): GraphDocument {
	const strip = (tags: string[]) => tags.filter((t) => t !== tag);

	let changed = false;
	const nodes = { ...doc.nodes };
	for (const [id, node] of Object.entries(nodes)) {
		const tags = node.tags ?? [];
		if (!tags.includes(tag)) continue;
		nodes[id] = { ...node, tags: strip(tags) };
		changed = true;
	}
	const edges = { ...doc.edges };
	for (const [id, edge] of Object.entries(edges)) {
		const tags = edge.tags ?? [];
		if (!tags.includes(tag)) continue;
		edges[id] = { ...edge, tags: strip(tags) };
		changed = true;
	}
	if (!changed) return doc;
	return {
		...doc,
		nodes,
		edges,
		updatedAt: new Date().toISOString()
	};
}

/** Whether an entity passes the Tags focus list (empty focus → all pass). */
export function entityPassesFocus(tags: string[] | undefined, focusTags: string[]): boolean {
	if (focusTags.length === 0) return true;
	const list = tags ?? [];
	return focusTags.some((t) => list.includes(t));
}
