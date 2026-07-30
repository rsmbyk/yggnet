import { describe, expect, it } from 'vitest';
import {
	addNodeToSelection,
	clearSelection,
	createSelection,
	isEdgeSelected,
	isSelected,
	removeNodeFromSelection,
	selectEdge,
	selectNode,
	selectNodes,
	toggleEdgeInSelection,
	toggleNodeInSelection
} from './selection';

describe('selection', () => {
	it('selects a single node and clears', () => {
		let state = createSelection();
		state = selectNode(state, 'n1');
		expect(isSelected(state, 'n1')).toBe(true);
		expect(state.nodeIds).toEqual(['n1']);
		expect(state.edgeIds).toEqual([]);
		state = clearSelection(state);
		expect(state.nodeIds).toEqual([]);
	});

	it('supports multi-node toggle add and remove', () => {
		let state = createSelection();
		state = selectNode(state, 'n1');
		state = toggleNodeInSelection(state, 'n2');
		expect(state.nodeIds).toEqual(['n1', 'n2']);
		state = toggleNodeInSelection(state, 'n1');
		expect(state.nodeIds).toEqual(['n2']);
		state = addNodeToSelection(state, 'n3');
		expect(state.nodeIds).toEqual(['n2', 'n3']);
		state = removeNodeFromSelection(state, 'n2');
		expect(state.nodeIds).toEqual(['n3']);
	});

	it('selectNodes replaces the set', () => {
		const state = selectNodes(['a', 'b', 'a']);
		expect(state.nodeIds).toEqual(['a', 'b']);
		expect(state.edgeIds).toEqual([]);
	});

	it('add/remove are no-ops when membership unchanged', () => {
		let state = selectNode(createSelection(), 'n1');
		state = addNodeToSelection(state, 'n1');
		expect(state.nodeIds).toEqual(['n1']);
		state = removeNodeFromSelection(state, 'missing');
		expect(state.nodeIds).toEqual(['n1']);
	});
});
