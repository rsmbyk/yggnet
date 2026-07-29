import type { GraphDocument } from './types';

export function createEmptyDocument(title = 'Untitled'): GraphDocument {
	const now = new Date().toISOString();
	return {
		schemaVersion: 1,
		id: crypto.randomUUID(),
		title,
		nodes: {},
		edges: {},
		createdAt: now,
		updatedAt: now
	};
}

export function nodeCount(doc: GraphDocument): number {
	return Object.keys(doc.nodes).length;
}

export function edgeCount(doc: GraphDocument): number {
	return Object.keys(doc.edges).length;
}
