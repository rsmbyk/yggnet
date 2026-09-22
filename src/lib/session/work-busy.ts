/**
 * Full-screen load/generate overlay helpers.
 * Paint first, then run work. Unload is blocked while the overlay is up
 * ({@link applyBeforeUnloadGuard}).
 */

/** Extra overlay hold (ms). E2E sets `window.__YGGNET_BUSY_HOLD_MS`. */
export function busyHoldMs(): number {
	if (typeof window === 'undefined') return 0;
	const v = window.__YGGNET_BUSY_HOLD_MS;
	return typeof v === 'number' && v > 0 ? v : 0;
}

export function applyBeforeUnloadGuard(
	busy: boolean,
	event: Pick<BeforeUnloadEvent, 'preventDefault'> & { returnValue: string }
): void {
	if (!busy) return;
	event.preventDefault();
	event.returnValue = '';
}

/** Two frames so the overlay can composite above the canvas before work runs. */
export function waitForBusyOverlayPaint(): Promise<void> {
	if (typeof requestAnimationFrame !== 'function') return Promise.resolve();
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			requestAnimationFrame(() => resolve());
		});
	});
}

/** Abortable sleep used by the e2e overlay hold (after the document is already swapped). */
export function busyHold(signal?: AbortSignal): Promise<void> {
	const ms = busyHoldMs();
	if (ms <= 0) return Promise.resolve();
	if (signal?.aborted) return Promise.resolve();
	return new Promise((resolve) => {
		const finish = () => {
			clearTimeout(timer);
			signal?.removeEventListener('abort', finish);
			resolve();
		};
		const timer = setTimeout(finish, ms);
		signal?.addEventListener('abort', finish);
	});
}
