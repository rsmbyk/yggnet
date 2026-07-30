import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addEdge, addNode } from '../ops/ops';
import { findAllSimplePaths, findShortestPaths } from './paths';

describe('findAllSimplePaths', () => {
	it('lists all simple paths with caps', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc, { label: 'A' });
		doc = A.doc;
		const B = addNode(doc, { label: 'B' });
		doc = B.doc;
		const C = addNode(doc, { label: 'C' });
		doc = C.doc;
		const D = addNode(doc, { label: 'D' });
		doc = D.doc;
		doc = addEdge(doc, { from: A.nodeId, to: B.nodeId }).doc;
		doc = addEdge(doc, { from: B.nodeId, to: D.nodeId }).doc;
		doc = addEdge(doc, { from: A.nodeId, to: C.nodeId }).doc;
		doc = addEdge(doc, { from: C.nodeId, to: D.nodeId }).doc;
		doc = addEdge(doc, { from: B.nodeId, to: C.nodeId }).doc;

		const paths = findAllSimplePaths(doc, A.nodeId, D.nodeId);
		expect(paths.length).toBeGreaterThanOrEqual(2);
		expect(paths.every((p) => p.nodeIds[0] === A.nodeId && p.nodeIds.at(-1) === D.nodeId)).toBe(
			true
		);

		const capped = findAllSimplePaths(doc, A.nodeId, D.nodeId, { maxPaths: 1 });
		expect(capped).toHaveLength(1);

		const shallow = findAllSimplePaths(doc, A.nodeId, D.nodeId, { maxDepth: 1 });
		expect(shallow).toHaveLength(0);
	});

	it('returns empty for missing nodes', () => {
		expect(findAllSimplePaths(createEmptyDocument(), 'a', 'b')).toEqual([]);
	});

	it('includes trivial path when from === to', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc);
		doc = A.doc;
		expect(findAllSimplePaths(doc, A.nodeId, A.nodeId)).toEqual([
			{ nodeIds: [A.nodeId], edgeIds: [] }
		]);
	});

	it('respects directed edges', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc);
		doc = A.doc;
		const B = addNode(doc);
		doc = B.doc;
		doc = addEdge(doc, { from: A.nodeId, to: B.nodeId, directed: true }).doc;
		expect(findAllSimplePaths(doc, A.nodeId, B.nodeId)).toHaveLength(1);
		expect(findAllSimplePaths(doc, B.nodeId, A.nodeId)).toHaveLength(0);
	});
});

describe('findShortestPaths', () => {
	it('returns all hop-count ties', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc, { label: 'A' });
		doc = A.doc;
		const B = addNode(doc, { label: 'B' });
		doc = B.doc;
		const C = addNode(doc, { label: 'C' });
		doc = C.doc;
		const D = addNode(doc, { label: 'D' });
		doc = D.doc;
		doc = addEdge(doc, { from: A.nodeId, to: B.nodeId }).doc;
		doc = addEdge(doc, { from: B.nodeId, to: D.nodeId }).doc;
		doc = addEdge(doc, { from: A.nodeId, to: C.nodeId }).doc;
		doc = addEdge(doc, { from: C.nodeId, to: D.nodeId }).doc;

		const shortest = findShortestPaths(doc, A.nodeId, D.nodeId);
		expect(shortest).toHaveLength(2);
		expect(shortest.every((p) => p.nodeIds.length === 3 && p.edgeIds.length === 2)).toBe(true);
	});

	it('handles trivial, missing, and disconnected', () => {
		expect(findShortestPaths(createEmptyDocument(), 'a', 'b')).toEqual([]);
		let doc = createEmptyDocument();
		const A = addNode(doc);
		doc = A.doc;
		expect(findShortestPaths(doc, A.nodeId, A.nodeId)).toEqual([
			{ nodeIds: [A.nodeId], edgeIds: [] }
		]);
		const B = addNode(doc);
		doc = B.doc;
		expect(findShortestPaths(doc, A.nodeId, B.nodeId)).toEqual([]);
	});
});
