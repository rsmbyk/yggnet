import { describe, expect, it } from 'vitest';
import { createEmptyDocument, edgeCount, nodeCount } from './document';

describe('createEmptyDocument', () => {
	it('creates a schema v1 document with no nodes or edges', () => {
		const doc = createEmptyDocument('Demo');
		expect(doc.schemaVersion).toBe(1);
		expect(doc.title).toBe('Demo');
		expect(nodeCount(doc)).toBe(0);
		expect(edgeCount(doc)).toBe(0);
		expect(doc.id.length).toBeGreaterThan(0);
	});

	it('defaults the title to Untitled', () => {
		expect(createEmptyDocument().title).toBe('Untitled');
	});
});
