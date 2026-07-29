import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
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
});
