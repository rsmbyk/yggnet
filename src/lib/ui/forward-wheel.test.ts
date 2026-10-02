import { describe, expect, it } from 'vitest';
import { wheelInitFrom } from './forward-wheel';

describe('wheelInitFrom', () => {
	it('copies deltas and modifiers for a synthetic wheel event', () => {
		const init = wheelInitFrom({
			deltaX: 3,
			deltaY: 120,
			deltaZ: 0,
			deltaMode: 0,
			clientX: 40,
			clientY: 80,
			ctrlKey: true,
			shiftKey: false,
			altKey: false,
			metaKey: false
		});
		expect(init.bubbles).toBe(true);
		expect(init.cancelable).toBe(true);
		expect(init.deltaY).toBe(120);
		expect(init.deltaX).toBe(3);
		expect(init.ctrlKey).toBe(true);
		expect(init.clientX).toBe(40);
	});
});
