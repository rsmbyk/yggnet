import { describe, expect, it } from 'vitest';
import { clearSelection, createSelection, isSelected, selectNode } from './selection';

describe('selection', () => {
	it('selects a single node and clears', () => {
		let state = createSelection();
		state = selectNode(state, 'n1');
		expect(isSelected(state, 'n1')).toBe(true);
		expect(state.nodeIds).toEqual(['n1']);
		state = clearSelection(state);
		expect(state.nodeIds).toEqual([]);
	});
});
