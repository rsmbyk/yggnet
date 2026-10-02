import { describe, expect, it } from 'vitest';
import {
	addEdgeToSelection,
	addNodeToSelection,
	clearSelection,
	createSelection,
	isEdgeSelected,
	isSelected,
	removeEdgeFromSelection,
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

	it('selects a single edge and clears nodes', () => {
		let state = selectNode(createSelection(), 'n1');
		state = selectEdge(state, 'e1');
		expect(isEdgeSelected(state, 'e1')).toBe(true);
		expect(isSelected(state, 'n1')).toBe(false);
		expect(state.nodeIds).toEqual([]);
		expect(state.edgeIds).toEqual(['e1']);
	});

	it('supports multi-edge toggle add and remove exclusive of nodes', () => {
		let state = selectNode(createSelection(), 'n1');
		state = toggleEdgeInSelection(state, 'e1');
		expect(state.nodeIds).toEqual([]);
		expect(state.edgeIds).toEqual(['e1']);
		state = toggleEdgeInSelection(state, 'e2');
		expect(state.edgeIds).toEqual(['e1', 'e2']);
		state = toggleEdgeInSelection(state, 'e1');
		expect(state.edgeIds).toEqual(['e2']);
	});

	it('addEdgeToSelection is idempotent and clears nodes', () => {
		let state = selectNode(createSelection(), 'n1');
		state = addEdgeToSelection(state, 'e1');
		expect(state).toEqual(createSelection([], ['e1']));
		const again = addEdgeToSelection(state, 'e1');
		expect(again.edgeIds).toEqual(['e1']);
		expect(again.nodeIds).toEqual([]);
	});

	it('removeEdgeFromSelection drops one edge and clears nodes', () => {
		let state = createSelection([], ['e1', 'e2']);
		state = removeEdgeFromSelection(state, 'e1');
		expect(state.edgeIds).toEqual(['e2']);
		expect(state.nodeIds).toEqual([]);
	});
});
