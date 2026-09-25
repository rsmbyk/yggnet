import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from './model/document';
import { addEdge, addNode } from './ops/ops';
import {
	collectDocumentTags,
	collectTagUsage,
	deleteTag,
	entityPassesFocus,
	isValidTag,
	normalizeTags,
	renameTag
} from './tags';

describe('isValidTag / normalizeTags', () => {
	it('accepts alphanumeric and hyphen', () => {
		expect(isValidTag('a')).toBe(true);
		expect(isValidTag('Tag-1')).toBe(true);
		expect(isValidTag('--')).toBe(true);
		expect(isValidTag('9')).toBe(true);
	});

	it('rejects empty, spaces, and punctuation', () => {
		expect(isValidTag('')).toBe(false);
		expect(isValidTag('bad tag')).toBe(false);
		expect(isValidTag('bad_tag')).toBe(false);
		expect(isValidTag('a!')).toBe(false);
	});

	it('silently strips invalid, trims, and dedupes', () => {
		expect(normalizeTags(['  ok  ', 'bad tag!', 'ok', 'x_y', 'Tag-1'])).toEqual(['ok', 'Tag-1']);
		expect(normalizeTags(null)).toEqual([]);
		expect(normalizeTags(undefined)).toEqual([]);
		expect(normalizeTags(['', '  ', 12 as unknown as string])).toEqual([]);
	});
});

describe('collectTagUsage / collectDocumentTags', () => {
	it('unions node and edge tags and sorts by node then edge usage', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['shared', 'node-only'] });
		doc = a.doc;
		const b = addNode(doc, { tags: ['shared'] });
		doc = b.doc;
		const e = addEdge(doc, { from: a.nodeId, to: b.nodeId, tags: ['shared', 'edge-only'] });
		doc = e.doc;

		const usage = collectTagUsage(doc);
		expect(usage.map((u) => u.tag)).toEqual(['shared', 'node-only', 'edge-only']);
		expect(usage[0]).toEqual({ tag: 'shared', nodeCount: 2, edgeCount: 1 });
		expect(collectDocumentTags(doc)).toEqual(['shared', 'node-only', 'edge-only']);
	});

	it('ignores invalid tags already on entities', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['good'] });
		doc = a.doc;
		doc = {
			...doc,
			nodes: {
				...doc.nodes,
				[a.nodeId]: { ...doc.nodes[a.nodeId], tags: ['good', 'bad tag'] }
			},
			edges: {
				e1: {
					id: 'e1',
					from: a.nodeId,
					to: a.nodeId,
					directed: false,
					weight: 1,
					tags: undefined as unknown as string[],
					attachments: [],
					data: {}
				}
			}
		};
		expect(collectDocumentTags(doc)).toEqual(['good']);
	});
});

describe('renameTag / deleteTag', () => {
	it('renames across nodes and edges', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['old'] });
		doc = a.doc;
		const b = addNode(doc, { tags: ['keep'] });
		doc = b.doc;
		const e = addEdge(doc, { from: a.nodeId, to: b.nodeId, tags: ['old'] });
		doc = e.doc;

		doc = renameTag(doc, 'old', 'new');
		expect(doc.nodes[a.nodeId].tags).toEqual(['new']);
		expect(doc.nodes[b.nodeId].tags).toEqual(['keep']);
		expect(doc.edges[e.edgeId].tags).toEqual(['new']);
	});

	it('rejects invalid or colliding rename targets', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['old', 'taken'] });
		doc = a.doc;
		expect(() => renameTag(doc, 'old', 'bad tag')).toThrow(/Invalid tag/i);
		expect(() => renameTag(doc, 'old', 'taken')).toThrow(/already exists/i);
		expect(renameTag(doc, 'old', 'old')).toBe(doc);
	});

	it('cascades delete from all nodes and edges', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['gone', 'keep'] });
		doc = a.doc;
		const b = addNode(doc, { tags: ['gone'] });
		doc = b.doc;
		const e = addEdge(doc, { from: a.nodeId, to: b.nodeId, tags: ['gone'] });
		doc = e.doc;

		doc = deleteTag(doc, 'gone');
		expect(doc.nodes[a.nodeId].tags).toEqual(['keep']);
		expect(doc.nodes[b.nodeId].tags).toEqual([]);
		expect(doc.edges[e.edgeId].tags).toEqual([]);
	});

	it('deleteTag is a no-op when the tag is absent', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['keep'] });
		doc = a.doc;
		expect(deleteTag(doc, 'missing')).toBe(doc);
	});

	it('rename and delete tolerate missing edge.tags', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { tags: ['x'] });
		doc = a.doc;
		doc = {
			...doc,
			edges: {
				e1: {
					id: 'e1',
					from: a.nodeId,
					to: a.nodeId,
					directed: false,
					weight: 1,
					tags: undefined as unknown as string[],
					attachments: [],
					data: {}
				}
			}
		};
		expect(renameTag(doc, 'x', 'y').nodes[a.nodeId].tags).toEqual(['y']);
		expect(deleteTag(doc, 'x').nodes[a.nodeId].tags).toEqual([]);
	});
});

describe('entityPassesFocus', () => {
	it('passes all when focus empty; otherwise any focus tag', () => {
		expect(entityPassesFocus(['a'], [])).toBe(true);
		expect(entityPassesFocus(['a'], ['a'])).toBe(true);
		expect(entityPassesFocus(['a'], ['b'])).toBe(false);
		expect(entityPassesFocus(undefined, ['a'])).toBe(false);
	});
});
