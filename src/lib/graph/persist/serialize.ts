import type { GraphDocument } from '../model/types';

/** Serialize a document to JSON text. */
export function serializeDocument(doc: GraphDocument): string {
	return JSON.stringify(doc);
}

/**
 * Parse and validate a GraphDocument.
 * Requires `schemaVersion === 1`; throws on invalid JSON or schema.
 */
export function parseDocument(json: string): GraphDocument {
	let value: unknown;
	try {
		value = JSON.parse(json);
	} catch {
		throw new Error('Invalid JSON');
	}
	if (value === null || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error('Invalid GraphDocument: expected object');
	}
	const doc = value as Record<string, unknown>;
	if (doc.schemaVersion !== 1) {
		throw new Error(`Unsupported schemaVersion: ${String(doc.schemaVersion)}`);
	}
	if (typeof doc.id !== 'string' || typeof doc.title !== 'string') {
		throw new Error('Invalid GraphDocument: missing id or title');
	}
	if (
		typeof doc.nodes !== 'object' ||
		doc.nodes === null ||
		Array.isArray(doc.nodes) ||
		typeof doc.edges !== 'object' ||
		doc.edges === null ||
		Array.isArray(doc.edges)
	) {
		throw new Error('Invalid GraphDocument: nodes/edges must be objects');
	}
	if (typeof doc.createdAt !== 'string' || typeof doc.updatedAt !== 'string') {
		throw new Error('Invalid GraphDocument: missing timestamps');
	}
	return value as GraphDocument;
}

/** Deep clone via structured clone (JSON-safe domain data). */
export function cloneDocument(doc: GraphDocument): GraphDocument {
	return structuredClone(doc);
}
