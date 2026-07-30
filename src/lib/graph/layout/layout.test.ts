import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addNode } from '../ops/ops';
import { layoutUnpinned } from './layout';

function pos(doc: ReturnType<typeof createEmptyDocument>, id: string) {
	return doc.nodes[id].position;
}

describe('layoutUnpinned', () => {
	it('returns the same document when there are no nodes', () => {
		const doc = createEmptyDocument();
		expect(layoutUnpinned(doc)).toBe(doc);
	});

	it('returns the same document when every node is pinned', () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { pinned: true, position: { x: 1, y: 0, z: 2 } });
		doc = a.doc;
		const b = addNode(doc, { pinned: true, position: { x: 3, y: 0, z: 4 } });
		doc = b.doc;
		expect(layoutUnpinned(doc)).toBe(doc);
	});

	it('moves unpinned nodes and leaves pinned nodes fixed', () => {
		let doc = createEmptyDocument();
		const pinned = addNode(doc, {
			label: 'Pinned',
			pinned: true,
			position: { x: 10, y: 1, z: 20 }
		});
		doc = pinned.doc;
		const free = addNode(doc, {
			label: 'Free',
			pinned: false,
			position: { x: 10, y: 1, z: 20 }
		});
		doc = free.doc;

		const laid = layoutUnpinned(doc, { radius: 5 });
		expect(pos(laid, pinned.nodeId)).toEqual({ x: 10, y: 1, z: 20 });
		const after = pos(laid, free.nodeId);
		expect(after.x).not.toBe(10);
		expect(after.z).not.toBe(20);
	});

	it('arranges multiple unpinned nodes on a circle', () => {
		let doc = createEmptyDocument();
		const ids: string[] = [];
		for (let i = 0; i < 3; i++) {
			const r = addNode(doc, { pinned: false, position: { x: 0, y: 0, z: 0 } });
			doc = r.doc;
			ids.push(r.nodeId);
		}
		const laid = layoutUnpinned(doc, { radius: 6 });
		const positions = ids.map((id) => pos(laid, id));
		const distinct = new Set(positions.map((p) => `${p.x},${p.z}`));
		expect(distinct.size).toBe(3);
	});

	it('centers unpinned layout on pinned centroid', () => {
		let doc = createEmptyDocument();
		const anchor = addNode(doc, {
			pinned: true,
			position: { x: 100, y: 0, z: -50 }
		});
		doc = anchor.doc;
		const free = addNode(doc, { pinned: false, position: { x: 100, y: 0, z: -50 } });
		doc = free.doc;

		const laid = layoutUnpinned(doc, { radius: 8 });
		const p = pos(laid, free.nodeId);
		const dist = Math.hypot(p.x - 100, p.z - -50);
		expect(dist).toBeCloseTo(8, 5);
	});
});
