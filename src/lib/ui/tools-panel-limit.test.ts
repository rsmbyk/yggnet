import { describe, expect, it } from 'vitest';
import { cssLengthToPx, toolsPanelMaxHeight, toolsPanelOverflows } from './tools-panel-limit';

describe('toolsPanelMaxHeight', () => {
	const base = {
		panelTop: 72,
		dockBottom: 788,
		minimapTop: 480,
		edge: 12
	};

	it('stops above the minimap when collapsed', () => {
		expect(toolsPanelMaxHeight({ ...base, expanded: false })).toBe(396);
	});

	it('uses the dock bottom when expanded', () => {
		expect(toolsPanelMaxHeight({ ...base, expanded: true })).toBe(716);
	});

	it('falls back to the dock bottom when the minimap is missing', () => {
		expect(toolsPanelMaxHeight({ ...base, minimapTop: null, expanded: false })).toBe(716);
	});

	it('never exceeds the dock bottom', () => {
		expect(toolsPanelMaxHeight({ ...base, minimapTop: 900, expanded: false })).toBe(716);
	});
});

describe('cssLengthToPx', () => {
	it('converts rem using the root font size', () => {
		expect(cssLengthToPx('0.75rem', 16)).toBe(12);
	});

	it('reads raw pixels', () => {
		expect(cssLengthToPx('12px', 16)).toBe(12);
	});
});

describe('toolsPanelOverflows', () => {
	it('is true when content is taller than the cap', () => {
		expect(toolsPanelOverflows(400, 396)).toBe(true);
		expect(toolsPanelOverflows(396, 396)).toBe(false);
		expect(toolsPanelOverflows(397, 396)).toBe(false);
		expect(toolsPanelOverflows(398, 396)).toBe(true);
	});
});
