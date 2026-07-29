import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addNode, addEdge } from '../ops/ops';
import { MainThreadRunner } from './main-thread-runner';

describe('MainThreadRunner', () => {
	it('returns an empty result with start/done trace for unknown algorithms', async () => {
		const runner = new MainThreadRunner();
		const out = await runner.run({
			documentSnapshot: createEmptyDocument(),
			algorithmId: 'noop',
			params: {}
		});
		expect(out.result).toEqual({ kind: 'empty' });
		expect(out.trace[0]).toMatchObject({ type: 'start', algorithmId: 'noop' });
		expect(out.trace.at(-1)).toMatchObject({ type: 'done' });
	});

	it('runs a registered algorithm with from/to params', async () => {
		let doc = createEmptyDocument();
		const a = addNode(doc, { label: 'A', position: { x: 0, y: 0, z: 0 } });
		doc = a.doc;
		const b = addNode(doc, { label: 'B', position: { x: 2, y: 0, z: 0 } });
		doc = b.doc;
		doc = addEdge(doc, { from: a.nodeId, to: b.nodeId }).doc;

		const runner = new MainThreadRunner();
		const out = await runner.run({
			documentSnapshot: doc,
			algorithmId: 'bfs',
			params: { from: a.nodeId, to: b.nodeId }
		});
		expect(out.result.kind).toBe('path');
		if (out.result.kind === 'path') {
			expect(out.result.nodeIds).toEqual([a.nodeId, b.nodeId]);
		}
	});
});
