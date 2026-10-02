import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addNode, updateNode } from '../ops/ops';
import { cloneDocument, parseDocument, serializeDocument } from './serialize';

describe('serialize', () => {
	it('round-trips a document', () => {
		let doc = createEmptyDocument('Demo');
		doc = addNode(doc, { label: 'A' }).doc;
		const json = serializeDocument(doc);
		const parsed = parseDocument(json);
		expect(parsed).toEqual(doc);
	});

	it('round-trips node group membership', () => {
		let doc = createEmptyDocument('Groups');
		const a = addNode(doc, { label: 'A' });
		doc = a.doc;
		const b = addNode(doc, { label: 'B' });
		doc = b.doc;
		const groupId = 'district-1';
		doc = updateNode(doc, a.nodeId, { groupId });
		doc = updateNode(doc, b.nodeId, { groupId });
		const parsed = parseDocument(serializeDocument(doc));
		expect(parsed.nodes[a.nodeId].groupId).toBe(groupId);
		expect(parsed.nodes[b.nodeId].groupId).toBe(groupId);
	});

	it('round-trips node attachments', () => {
		let doc = createEmptyDocument('Attachments');
		const a = addNode(doc, { label: 'A' });
		doc = a.doc;
		const attachments = [
			{ name: 'readme', payload: 'hello' },
			{ name: 'data', payload: 'data:text/plain,world' }
		];
		doc = updateNode(doc, a.nodeId, { attachments });
		const parsed = parseDocument(serializeDocument(doc));
		expect(parsed.nodes[a.nodeId].attachments).toEqual(attachments);
	});

	it('cloneDocument returns a deep copy', () => {
		const doc = createEmptyDocument();
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
		expect(() => parseDocument(JSON.stringify({ schemaVersion: 2 }))).toThrow(/schemaVersion/i);
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

	it('parseDocument silently strips invalid tags', () => {
		const parsed = parseDocument(
			JSON.stringify({
				schemaVersion: 1,
				id: 'x',
				title: 't',
				nodes: {
					n1: {
						id: 'n1',
						label: 'A',
						position: { x: 0, y: 0, z: 0 },
						pinned: false,
						tags: ['ok', 'bad tag!', 'also_bad'],
						attachments: [],
						data: {}
					}
				},
				edges: {
					e1: {
						id: 'e1',
						from: 'n1',
						to: 'n1',
						directed: false,
						weight: 1,
						tags: ['edge-ok', 'nope!'],
						attachments: [],
						data: {}
					}
				},
				createdAt: 'a',
				updatedAt: 'b'
			})
		);
		expect(parsed.nodes.n1.tags).toEqual(['ok']);
		expect(parsed.edges.e1.tags).toEqual(['edge-ok']);
	});
});
