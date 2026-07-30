import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addNode } from '../ops/ops';
import { cloneDocument, parseDocument, serializeDocument } from './serialize';

describe('serialize', () => {
	it('round-trips a document', () => {
		let doc = createEmptyDocument('Demo');
		doc = addNode(doc, { label: 'A' }).doc;
		const json = serializeDocument(doc);
		const parsed = parseDocument(json);
		expect(parsed).toEqual(doc);
	});

	it('cloneDocument returns a deep copy', () => {
		let doc = createEmptyDocument();
		const { doc: withNode, nodeId } = addNode(doc, { label: 'A', data: { n: 1 } });
		const clone = cloneDocument(withNode);
		expect(clone).toEqual(withNode);
		expect(clone).not.toBe(withNode);
		clone.nodes[nodeId].label = 'B';
		expect(withNode.nodes[nodeId].label).toBe('A');
	});

	it('parseDocument rejects invalid inputs', () => {
		expect(() => parseDocument('{')).toThrow(/Invalid JSON/i);
		expect(() => parseDocument('null')).toThrow(/expected object/i);
		expect(() => parseDocument('[]')).toThrow(/expected object/i);
		expect(() => parseDocument(JSON.stringify({ schemaVersion: 2 }))).toThrow(
			/schemaVersion/i
		);
		expect(() =>
			parseDocument(
				JSON.stringify({
					schemaVersion: 1,
					id: 1,
					title: 't'
				})
			)
		).toThrow(/id or title/i);
		expect(() =>
			parseDocument(
				JSON.stringify({
					schemaVersion: 1,
					id: 'x',
					title: 't',
					nodes: [],
					edges: {},
					createdAt: 'a',
					updatedAt: 'b'
				})
			)
		).toThrow(/nodes\/edges/i);
		expect(() =>
			parseDocument(
				JSON.stringify({
					schemaVersion: 1,
					id: 'x',
					title: 't',
					nodes: {},
					edges: {},
					createdAt: 1,
					updatedAt: 'b'
				})
			)
		).toThrow(/timestamps/i);
	});
});
