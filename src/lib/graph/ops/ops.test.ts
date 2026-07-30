import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import {
	addEdge,
	addNode,
	removeEdge,
	removeNode,
	touch,
	updateEdge,
	updateNode
} from './ops';

describe('ops', () => {
	it('addNode applies defaults', () => {
		const base = createEmptyDocument();
		const { doc, nodeId } = addNode(base);
		expect(doc.nodes[nodeId]).toMatchObject({
			id: nodeId,
			label: 'Node',
			position: { x: 0, y: 0, z: 0 },
			pinned: false,
			tags: [],
			attachments: [],
			data: {}
		});
		expect(doc.updatedAt >= base.updatedAt).toBe(true);
	});

	it('addNode accepts partial overrides', () => {
		const { doc, nodeId } = addNode(createEmptyDocument(), {
			label: 'A',
			position: { x: 1, y: 2, z: 3 },
			pinned: true,
			tags: ['t'],
			notes: 'n',
			groupId: 'g',
			weight: 2,
			attachments: [{ name: 'ref', payload: 'data:text/plain,hello' }],
			data: { k: 1 }
		});
		expect(doc.nodes[nodeId]).toMatchObject({
			label: 'A',
			position: { x: 1, y: 2, z: 3 },
			pinned: true,
			tags: ['t'],
			notes: 'n',
			groupId: 'g',
			weight: 2,
			attachments: [{ name: 'ref', payload: 'data:text/plain,hello' }],
			data: { k: 1 }
		});
	});

	it('updateNode replaces attachments array', () => {
		let { doc, nodeId } = addNode(createEmptyDocument(), { label: 'A' });
		const attachments = [
			{ name: 'note', payload: 'hello' },
			{ name: 'link', payload: 'data:text/plain,world' }
		];
		doc = updateNode(doc, nodeId, { attachments });
		expect(doc.nodes[nodeId].attachments).toEqual(attachments);
		doc = updateNode(doc, nodeId, { attachments: [{ name: 'only', payload: 'x' }] });
		expect(doc.nodes[nodeId].attachments).toEqual([{ name: 'only', payload: 'x' }]);
	});

	it('updateEdge replaces attachments array', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const e = addEdge(doc, { from: a.nodeId, to: b.nodeId });
		doc = e.doc;
		const attachments = [{ name: 'proof', payload: 'edge-data' }];
		doc = updateEdge(doc, e.edgeId, { attachments });
		expect(doc.edges[e.edgeId].attachments).toEqual(attachments);
	});

	it('updateNode merges patch and throws for missing id', () => {
		let { doc, nodeId } = addNode(createEmptyDocument(), { label: 'A' });
		doc = updateNode(doc, nodeId, { label: 'B', position: { x: 9, y: 0, z: 0 } });
		expect(doc.nodes[nodeId].label).toBe('B');
		expect(doc.nodes[nodeId].position).toEqual({ x: 9, y: 0, z: 0 });
		expect(() => updateNode(doc, 'missing', { label: 'x' })).toThrow(/not found/i);
	});

	it('removeNode deletes incident edges', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const e = addEdge(doc, { from: a.nodeId, to: b.nodeId });
		doc = e.doc;
		doc = removeNode(doc, a.nodeId);
		expect(doc.nodes[a.nodeId]).toBeUndefined();
		expect(doc.edges[e.edgeId]).toBeUndefined();
		expect(doc.nodes[b.nodeId]).toBeDefined();
		expect(() => removeNode(doc, a.nodeId)).toThrow(/not found/i);
	});

	it('addEdge defaults and validates endpoints', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const { doc: withEdge, edgeId } = addEdge(doc, { from: a.nodeId, to: b.nodeId });
		expect(withEdge.edges[edgeId]).toMatchObject({
			from: a.nodeId,
			to: b.nodeId,
			directed: false,
			weight: 1,
			attachments: [],
			data: {}
		});
		expect(() => addEdge(doc, { from: a.nodeId, to: 'nope' })).toThrow(/not found/i);
		expect(() => addEdge(doc, { from: 'nope', to: b.nodeId })).toThrow(/not found/i);
	});

	it('addEdge accepts directed, weight, label', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const { doc: withEdge, edgeId } = addEdge(doc, {
			from: a.nodeId,
			to: b.nodeId,
			directed: true,
			weight: 3.5,
			label: 'link'
		});
		expect(withEdge.edges[edgeId]).toMatchObject({
			directed: true,
			weight: 3.5,
			label: 'link'
		});
	});

	it('updateEdge and removeEdge', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const c = addNode(doc);
		doc = c.doc;
		const e = addEdge(doc, { from: a.nodeId, to: b.nodeId });
		doc = e.doc;
		doc = updateEdge(doc, e.edgeId, { weight: 9, directed: true, label: 'L' });
		expect(doc.edges[e.edgeId]).toMatchObject({ weight: 9, directed: true, label: 'L' });
		doc = updateEdge(doc, e.edgeId, { to: c.nodeId });
		expect(doc.edges[e.edgeId].to).toBe(c.nodeId);
		expect(() => updateEdge(doc, e.edgeId, { to: 'missing' })).toThrow(/not found/i);
		expect(() => updateEdge(doc, 'missing', { weight: 1 })).toThrow(/not found/i);
		doc = removeEdge(doc, e.edgeId);
		expect(doc.edges[e.edgeId]).toBeUndefined();
		expect(() => removeEdge(doc, e.edgeId)).toThrow(/not found/i);
	});

	it('touch updates updatedAt', () => {
		const doc = createEmptyDocument();
		const next = touch(doc);
		expect(next.updatedAt >= doc.updatedAt).toBe(true);
		expect(next).not.toBe(doc);
	});
});
