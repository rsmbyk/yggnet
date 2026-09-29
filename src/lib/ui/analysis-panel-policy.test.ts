import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	RESULT_IDLE_REPLAY_MS,
	formatInspectorValue,
	inspectorValueSummary,
	watchResultIdle
} from './analysis-panel-policy';

describe('analysis panel policy', () => {
	afterEach(() => vi.useRealTimers());

	it('treats missing and initialized empty inspector values the same', () => {
		expect(inspectorValueSummary(undefined)).toEqual({ count: 0, empty: true });
		expect(inspectorValueSummary([])).toEqual({ count: 0, empty: true });
		expect(inspectorValueSummary({})).toEqual({ count: 0, empty: true });
		expect(inspectorValueSummary(['A'])).toEqual({ count: 1, empty: false });
		expect(formatInspectorValue(undefined)).toBe('Empty');
		expect(formatInspectorValue([])).toBe('Empty');
		expect(formatInspectorValue({})).toBe('Empty');
	});

	it('restarts the ten-second idle window for mouse, pointer, wheel, and keyboard activity', () => {
		vi.useFakeTimers();
		const target = new EventTarget();
		const onIdle = vi.fn();
		const stop = watchResultIdle(target, onIdle);

		vi.advanceTimersByTime(RESULT_IDLE_REPLAY_MS - 1);
		expect(onIdle).not.toHaveBeenCalled();
		for (const type of ['mousemove', 'pointerdown', 'wheel', 'click', 'keydown']) {
			target.dispatchEvent(new Event(type));
			vi.advanceTimersByTime(RESULT_IDLE_REPLAY_MS - 1);
			expect(onIdle).not.toHaveBeenCalled();
		}
		vi.advanceTimersByTime(1);
		expect(onIdle).toHaveBeenCalledOnce();
		stop();
	});
});
