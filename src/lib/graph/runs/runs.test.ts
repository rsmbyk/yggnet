import { describe, expect, it } from 'vitest';
import { createRunStore, addRun, annotateStep, getRun, markAllStale } from './runs';

describe('runs', () => {
	it('createRunStore / addRun / getRun', () => {
		const store = createRunStore();
		const { store: next, run } = addRun(store, {
			algorithmId: 'bfs',
			params: { from: 'a', to: 'b' },
			result: { kind: 'empty' },
			trace: [
				{ type: 'start', algorithmId: 'bfs' },
				{ type: 'done', result: { kind: 'empty' } }
			]
		});
		expect(run.stale).toBe(false);
		expect(run.id.length).toBeGreaterThan(0);
		expect(getRun(next, run.id)).toEqual(run);
		expect(getRun(next, 'missing')).toBeUndefined();
	});

	it('markAllStale flags every run', () => {
		let store = createRunStore();
		const a = addRun(store, {
			algorithmId: 'bfs',
			params: {},
			result: { kind: 'empty' },
			trace: []
		});
		store = a.store;
		const b = addRun(store, {
			algorithmId: 'dijkstra',
			params: {},
			result: { kind: 'empty' },
			trace: []
		});
		store = markAllStale(b.store);
		expect(Object.values(store.runs).every((r) => r.stale)).toBe(true);
	});

	it('annotateStep writes notes by step index', () => {
		let store = createRunStore();
		const { store: withRun, run } = addRun(store, {
			algorithmId: 'bfs',
			params: {},
			result: { kind: 'path', nodeIds: ['a'], edgeIds: [] },
			trace: [{ type: 'start', algorithmId: 'bfs' }]
		});
		store = annotateStep(withRun, run.id, 0, 'started here');
		expect(getRun(store, run.id)?.annotations?.[0]).toBe('started here');
		store = annotateStep(store, run.id, 1, 'next');
		expect(getRun(store, run.id)?.annotations).toEqual({ 0: 'started here', 1: 'next' });
		expect(() => annotateStep(store, 'missing', 0, 'x')).toThrow(/not found/i);
	});

	it('addRun can seed annotations and explicit id', () => {
		const { run } = addRun(createRunStore(), {
			id: 'run-1',
			algorithmId: 'bfs',
			params: { from: 'a', to: 'b' },
			result: { kind: 'empty' },
			trace: [],
			annotations: { 2: 'note' }
		});
		expect(run.id).toBe('run-1');
		expect(run.annotations).toEqual({ 2: 'note' });
	});
});
