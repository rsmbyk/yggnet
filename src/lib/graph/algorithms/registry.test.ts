import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addEdge, addNode } from '../ops/ops';
import { getAlgorithm, listAlgorithms, registerAlgorithm } from './registry';
import { MainThreadRunner } from './main-thread-runner';
import type { GraphDocument } from '../model/types';

function diamond(): { doc: GraphDocument; a: string; b: string; c: string; d: string } {
	let doc = createEmptyDocument();
	const A = addNode(doc, { label: 'A', position: { x: 0, y: 0, z: 0 } });
	doc = A.doc;
	const B = addNode(doc, { label: 'B', position: { x: 1, y: 0, z: 0 } });
	doc = B.doc;
	const C = addNode(doc, { label: 'C', position: { x: 0, y: 1, z: 0 } });
	doc = C.doc;
	const D = addNode(doc, { label: 'D', position: { x: 1, y: 1, z: 0 } });
	doc = D.doc;
	// A-B-D and A-C-D
	doc = addEdge(doc, { from: A.nodeId, to: B.nodeId, weight: 1 }).doc;
	doc = addEdge(doc, { from: B.nodeId, to: D.nodeId, weight: 1 }).doc;
	doc = addEdge(doc, { from: A.nodeId, to: C.nodeId, weight: 1 }).doc;
	doc = addEdge(doc, { from: C.nodeId, to: D.nodeId, weight: 1 }).doc;
	return { doc, a: A.nodeId, b: B.nodeId, c: C.nodeId, d: D.nodeId };
}

describe('algorithm registry', () => {
	it('lists built-in bfs, dijkstra, astar', () => {
		const ids = listAlgorithms().map((a) => a.id).sort();
		expect(ids).toEqual(['astar', 'bfs', 'dijkstra']);
		expect(getAlgorithm('bfs')?.name).toBe('BFS');
		expect(getAlgorithm('missing')).toBeUndefined();
	});

	it('registerAlgorithm adds a custom entry', () => {
		registerAlgorithm({
			id: 'noop-test',
			name: 'Noop',
			description: 'test',
			needs: { from: true, to: true, weighted: false },
			run: () => ({
				result: { kind: 'empty' },
				trace: [
					{ type: 'start', algorithmId: 'noop-test' },
					{ type: 'done', result: { kind: 'empty' } }
				]
			})
		});
		expect(getAlgorithm('noop-test')?.name).toBe('Noop');
	});
});

describe('pathfinding algorithms', () => {
	it('BFS finds a hop-shortest path and emits trace events', () => {
		const { doc, a, d } = diamond();
		const out = getAlgorithm('bfs')!.run(doc, { from: a, to: d });
		expect(out.result.kind).toBe('path');
		if (out.result.kind === 'path') {
			expect(out.result.nodeIds[0]).toBe(a);
			expect(out.result.nodeIds.at(-1)).toBe(d);
			expect(out.result.nodeIds.length).toBe(3);
			expect(out.result.edgeIds.length).toBe(2);
		}
		expect(out.trace[0]).toMatchObject({ type: 'start', algorithmId: 'bfs' });
		expect(out.trace.some((e) => e.type === 'visit')).toBe(true);
		expect(out.trace.some((e) => e.type === 'relax')).toBe(true);
		expect(out.trace.at(-1)).toMatchObject({ type: 'done' });
	});

	it('BFS respects directed edges', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc, { label: 'A' });
		doc = A.doc;
		const B = addNode(doc, { label: 'B' });
		doc = B.doc;
		doc = addEdge(doc, { from: A.nodeId, to: B.nodeId, directed: true }).doc;
		const forward = getAlgorithm('bfs')!.run(doc, { from: A.nodeId, to: B.nodeId });
		expect(forward.result.kind).toBe('path');
		const backward = getAlgorithm('bfs')!.run(doc, { from: B.nodeId, to: A.nodeId });
		expect(backward.result).toEqual({ kind: 'empty' });
	});

	it('BFS undirected allows both directions', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc, { label: 'A' });
		doc = A.doc;
		const B = addNode(doc, { label: 'B' });
		doc = B.doc;
		doc = addEdge(doc, { from: A.nodeId, to: B.nodeId, directed: false }).doc;
		expect(getAlgorithm('bfs')!.run(doc, { from: B.nodeId, to: A.nodeId }).result.kind).toBe(
			'path'
		);
	});

	it('Dijkstra prefers lower total weight', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc, { label: 'A', position: { x: 0, y: 0, z: 0 } });
		doc = A.doc;
		const B = addNode(doc, { label: 'B', position: { x: 1, y: 0, z: 0 } });
		doc = B.doc;
		const C = addNode(doc, { label: 'C', position: { x: 2, y: 0, z: 0 } });
		doc = C.doc;
		// Direct heavy vs light via B
		doc = addEdge(doc, { from: A.nodeId, to: C.nodeId, weight: 10 }).doc;
		doc = addEdge(doc, { from: A.nodeId, to: B.nodeId, weight: 1 }).doc;
		doc = addEdge(doc, { from: B.nodeId, to: C.nodeId, weight: 1 }).doc;
		const out = getAlgorithm('dijkstra')!.run(doc, { from: A.nodeId, to: C.nodeId });
		expect(out.result.kind).toBe('path');
		if (out.result.kind === 'path') {
			expect(out.result.nodeIds).toEqual([A.nodeId, B.nodeId, C.nodeId]);
		}
	});

	it('A* finds a path using positions as heuristic', () => {
		const { doc, a, d } = diamond();
		const out = getAlgorithm('astar')!.run(doc, { from: a, to: d });
		expect(out.result.kind).toBe('path');
		if (out.result.kind === 'path') {
			expect(out.result.nodeIds[0]).toBe(a);
			expect(out.result.nodeIds.at(-1)).toBe(d);
		}
		expect(out.trace.some((e) => e.type === 'relax')).toBe(true);
	});

	it('returns empty for missing endpoints / disconnected', () => {
		const doc = createEmptyDocument();
		expect(getAlgorithm('bfs')!.run(doc, { from: 'x', to: 'y' }).result).toEqual({
			kind: 'empty'
		});
		let g = createEmptyDocument();
		const A = addNode(g);
		g = A.doc;
		const B = addNode(g);
		g = B.doc;
		expect(getAlgorithm('dijkstra')!.run(g, { from: A.nodeId, to: B.nodeId }).result).toEqual({
			kind: 'empty'
		});
		expect(getAlgorithm('astar')!.run(g, { from: A.nodeId, to: B.nodeId }).result).toEqual({
			kind: 'empty'
		});
	});

	it('same from/to yields trivial path', () => {
		let doc = createEmptyDocument();
		const A = addNode(doc);
		doc = A.doc;
		for (const id of ['bfs', 'dijkstra', 'astar'] as const) {
			const out = getAlgorithm(id)!.run(doc, { from: A.nodeId, to: A.nodeId });
			expect(out.result).toEqual({ kind: 'path', nodeIds: [A.nodeId], edgeIds: [] });
		}
	});
});

describe('MainThreadRunner', () => {
	it('returns empty for unknown algorithms', async () => {
		const runner = new MainThreadRunner();
		const out = await runner.run({
			documentSnapshot: createEmptyDocument(),
			algorithmId: 'noop',
			params: {}
		});
		expect(out.result).toEqual({ kind: 'empty' });
		expect(out.trace[0]).toMatchObject({ type: 'start', algorithmId: 'noop' });
	});

	it('dispatches registry algorithms', async () => {
		const { doc, a, d } = diamond();
		const runner = new MainThreadRunner();
		const out = await runner.run({
			documentSnapshot: doc,
			algorithmId: 'bfs',
			params: { from: a, to: d }
		});
		expect(out.result.kind).toBe('path');
	});
});
