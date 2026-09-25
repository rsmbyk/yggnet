import { describe, expect, it, vi } from 'vitest';
import { applyBeforeUnloadGuard, busyHold, busyHoldMs, waitForBusyOverlayPaint } from './work-busy';

describe('applyBeforeUnloadGuard', () => {
	it('does nothing when work is idle', () => {
		const event = { preventDefault() {}, returnValue: 'keep' };
		applyBeforeUnloadGuard(false, event as BeforeUnloadEvent);
		expect(event.returnValue).toBe('keep');
	});

	it('blocks unload while the overlay is up', () => {
		let prevented = false;
		const event = {
			preventDefault() {
				prevented = true;
			},
			returnValue: ''
		};
		applyBeforeUnloadGuard(true, event as BeforeUnloadEvent);
		expect(prevented).toBe(true);
		expect(event.returnValue).toBe('');
	});
});

describe('busyHoldMs', () => {
	it('is zero unless the e2e hold is set', () => {
		expect(busyHoldMs()).toBe(0);
	});
});

describe('waitForBusyOverlayPaint', () => {
	it('resolves after two animation frames', async () => {
		const frames: Array<FrameRequestCallback> = [];
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			frames.push(cb);
			return frames.length;
		});
		const done = waitForBusyOverlayPaint();
		expect(frames).toHaveLength(1);
		frames[0](0);
		expect(frames).toHaveLength(2);
		frames[1](0);
		await done;
		vi.unstubAllGlobals();
	});
});

describe('busyHold', () => {
	it('resolves immediately when aborted', async () => {
		vi.stubGlobal('window', { __YGGNET_BUSY_HOLD_MS: 5000 });
		const ac = new AbortController();
		ac.abort();
		const t0 = Date.now();
		await busyHold(ac.signal);
		expect(Date.now() - t0).toBeLessThan(50);
		vi.unstubAllGlobals();
	});
});
