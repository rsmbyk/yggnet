import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import {
	addEdge,
	addNode,
	autoTagGroup,
	nextGroupTagName,
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
		const added = addNode(createEmptyDocument(), { label: 'A' });
		let doc = added.doc;
		const nodeId = added.nodeId;
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
		const added = addNode(createEmptyDocument(), { label: 'A' });
		let doc = added.doc;
		const nodeId = added.nodeId;
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
			tags: [],
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

	it('addEdge accepts tags', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const { doc: withEdge, edgeId } = addEdge(doc, {
			from: a.nodeId,
			to: b.nodeId,
			tags: ['route']
		});
		expect(withEdge.edges[edgeId].tags).toEqual(['route']);
		doc = updateEdge(withEdge, edgeId, { tags: ['route', 'hot'] });
		expect(doc.edges[edgeId].tags).toEqual(['route', 'hot']);
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

describe('autoTagGroup / nextGroupTagName', () => {
	it('nextGroupTagName returns Group-1 on empty document', () => {
		const doc = createEmptyDocument();
		expect(nextGroupTagName(doc)).toBe('Group-1');
	});

	it('nextGroupTagName increments counter', () => {
		const doc = createEmptyDocument();
		const { doc: d1, tag: t1 } = autoTagGroup(doc, ['n1']);
		expect(t1).toBe('Group-1');
		expect(d1.groupTagCounter).toBe(1);

		const { doc: d2, tag: t2 } = autoTagGroup(d1, ['n2']);
		expect(t2).toBe('Group-2');
		expect(d2.groupTagCounter).toBe(2);
	});

	it('nextGroupTagName skips existing Group-N tags', () => {
		let doc = createEmptyDocument();
		// Create nodes first
		const n1 = addNode(doc);
		doc = n1.doc;
		const n2 = addNode(doc);
		doc = n2.doc;
		// Manually add Group-2 and Group-3 tags
		doc = updateNode(doc, n1.nodeId, { tags: ['Group-2'] });
		doc = updateNode(doc, n2.nodeId, { tags: ['Group-3'] });
		// Counter is still 0, but Group-1 is free, so it should pick Group-1
		const tag1 = nextGroupTagName(doc);
		expect(tag1).toBe('Group-1');

		// After adding Group-1, next should skip to Group-4
		const n3 = addNode(doc);
		doc = n3.doc;
		doc = updateNode(doc, n3.nodeId, { tags: ['Group-1'] });
		const tag2 = nextGroupTagName(doc);
		expect(tag2).toBe('Group-4');
	});

	it('autoTagGroup applies tag to multiple nodes', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;

		const { doc: d1, tag } = autoTagGroup(doc, [a.nodeId, b.nodeId]);
		expect(tag).toBe('Group-1');
		expect(d1.nodes[a.nodeId].tags).toContain('Group-1');
		expect(d1.nodes[b.nodeId].tags).toContain('Group-1');
		expect(d1.groupTagCounter).toBe(1);
	});

	it('autoTagGroup does not duplicate tag on node', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		doc = updateNode(doc, a.nodeId, { tags: ['Group-1'] });
		// Counter is 0, but Group-1 exists, so autoTagGroup should skip to Group-2
		const { doc: d1, tag } = autoTagGroup(doc, [a.nodeId]);
		expect(tag).toBe('Group-2');
		expect(d1.nodes[a.nodeId].tags).toContain('Group-1');
		expect(d1.nodes[a.nodeId].tags).toContain('Group-2');
	});

	it('autoTagGroup with empty nodeIds returns empty tag', () => {
		const doc = createEmptyDocument();
		const { doc: d1, tag } = autoTagGroup(doc, []);
		expect(tag).toBe('');
		expect(d1).toBe(doc);
	});

	it('autoTagGroup counter persists across calls', () => {
		const doc = createEmptyDocument();
		const { doc: d1 } = autoTagGroup(doc, ['n1']);
		expect(d1.groupTagCounter).toBe(1);

		const { doc: d2 } = autoTagGroup(d1, ['n2']);
		expect(d2.groupTagCounter).toBe(2);

		const { doc: d3 } = autoTagGroup(d2, ['n3']);
		expect(d3.groupTagCounter).toBe(3);
	});

	it('removeNode keeps edges not incident to removed node', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const c = addNode(doc);
		doc = c.doc;
		// Add edges: a-b and b-c
		const e1 = addEdge(doc, { from: a.nodeId, to: b.nodeId });
		doc = e1.doc;
		const e2 = addEdge(doc, { from: b.nodeId, to: c.nodeId });
		doc = e2.doc;
		// Remove node b - should keep edge a-c? No, a-c doesn't exist.
		// Actually, edges a-b and b-c should be removed, no edges remain
		doc = removeNode(doc, b.nodeId);
		expect(Object.keys(doc.edges)).toHaveLength(0);
	});

	it('removeNode keeps non-incident edges', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc);
		doc = a.doc;
		const b = addNode(doc);
		doc = b.doc;
		const c = addNode(doc);
		doc = c.doc;
		const d = addNode(doc);
		doc = d.doc;
		// Add edges: a-b and c-d (no shared nodes)
		const e1 = addEdge(doc, { from: a.nodeId, to: b.nodeId });
		doc = e1.doc;
		const e2 = addEdge(doc, { from: c.nodeId, to: d.nodeId });
		doc = e2.doc;
		// Remove node a - should keep edge c-d
		doc = removeNode(doc, a.nodeId);
		expect(doc.edges[e1.edgeId]).toBeUndefined();
		expect(doc.edges[e2.edgeId]).toBeDefined();
	});
});
