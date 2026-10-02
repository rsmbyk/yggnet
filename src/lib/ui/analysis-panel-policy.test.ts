import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	RESULT_IDLE_REPLAY_MS,
	analysisResultStatus,
	analysisTransportState,
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

	it('derives accessible boundary-aware transport states', () => {
		expect(analysisTransportState(0, 4, false)).toEqual({
			primary: 'play',
			resetDisabled: true
		});
		expect(analysisTransportState(1, 4, true)).toEqual({
			primary: 'pause',
			resetDisabled: false
		});
		expect(analysisTransportState(3, 4, false)).toEqual({
			primary: 'restart',
			resetDisabled: false
		});
	});

	it('distinguishes eligible no-result from rejected analyses', () => {
		expect(analysisResultStatus('no-result', 'Target was not reached.')).toEqual({
			heading: 'No result',
			summary: 'Target was not reached.',
			kind: 'no-result'
		});
		expect(analysisResultStatus('rejected', 'This graph has directed edges.')).toEqual({
			heading: 'Rejected',
			summary: 'This graph has directed edges.',
			kind: 'rejected'
		});
		expect(analysisResultStatus('complete', 'Found a path.')).toBeNull();
	});
});
