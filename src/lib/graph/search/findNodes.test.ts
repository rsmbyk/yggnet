import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addNode } from '../ops/ops';
import { findNodeByQuery, findNodesByQuery } from './findNodes';

describe('findNodesByQuery', () => {
	it('returns empty for blank query', () => {
		let doc = createEmptyDocument('Test');
		doc = addNode(doc, { label: 'Alpha' }).doc;
		expect(findNodesByQuery(doc, '')).toEqual([]);
		expect(findNodesByQuery(doc, '   ')).toEqual([]);
	});

	it('matches label substring case-insensitively', () => {
		let doc = createEmptyDocument('Test');
		const a = addNode(doc, { label: 'Falcon' });
		doc = a.doc;
		const b = addNode(doc, { label: 'Eagle' });
		doc = b.doc;
		expect(findNodesByQuery(doc, 'fal')).toEqual([a.nodeId]);
	});

	it('matches id prefix case-insensitively', () => {
		let doc = createEmptyDocument('Test');
		const a = addNode(doc, { label: 'One' });
		doc = a.doc;
		expect(findNodesByQuery(doc, a.nodeId.slice(0, 4))).toEqual([a.nodeId]);
	});

	it('returns multiple matches in document order', () => {
		let doc = createEmptyDocument('Test');
		const a = addNode(doc, { label: 'Node A' });
		doc = a.doc;
		const b = addNode(doc, { label: 'Node B' });
		doc = b.doc;
		expect(findNodesByQuery(doc, 'node')).toEqual([a.nodeId, b.nodeId]);
	});
});

describe('findNodeByQuery', () => {
	it('returns first match or null', () => {
		let doc = createEmptyDocument('Test');
		const a = addNode(doc, { label: 'Only' });
		doc = a.doc;
		expect(findNodeByQuery(doc, 'only')).toBe(a.nodeId);
		expect(findNodeByQuery(doc, 'missing')).toBeNull();
	});
});
