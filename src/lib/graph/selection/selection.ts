import type { EdgeId, NodeId } from '../model/types';

export interface SelectionState {
	nodeIds: readonly NodeId[];
	edgeIds: readonly EdgeId[];
}

export function createSelection(nodeIds: NodeId[] = [], edgeIds: EdgeId[] = []): SelectionState {
	return {
		nodeIds: Object.freeze([...nodeIds]),
		edgeIds: Object.freeze([...edgeIds])
	};
}

/** Replace selection with a single node (clears edges). */
export function selectNode(state: SelectionState, id: NodeId): SelectionState {
	return createSelection([id], []);
}

/** Replace selection with the given node set (clears edges). */
export function selectNodes(nodeIds: NodeId[]): SelectionState {
	return createSelection([...new Set(nodeIds)], []);
}

/** Add a node if missing; keep existing edges. */
export function addNodeToSelection(state: SelectionState, id: NodeId): SelectionState {
	if (state.nodeIds.includes(id)) return state;
	return createSelection([...state.nodeIds, id], [...state.edgeIds]);
}

/** Remove a node from selection. */
export function removeNodeFromSelection(state: SelectionState, id: NodeId): SelectionState {
	if (!state.nodeIds.includes(id)) return state;
	return createSelection(
		state.nodeIds.filter((n) => n !== id),
		[...state.edgeIds]
	);
}

/** Toggle membership of a node (additive multi-select). */
export function toggleNodeInSelection(state: SelectionState, id: NodeId): SelectionState {
	return state.nodeIds.includes(id)
		? removeNodeFromSelection(state, id)
		: addNodeToSelection(state, id);
}

export function selectEdge(state: SelectionState, id: EdgeId): SelectionState {
	return createSelection([], [id]);
}

export function toggleEdgeInSelection(state: SelectionState, id: EdgeId): SelectionState {
	if (state.edgeIds.includes(id)) {
		return createSelection(
			[...state.nodeIds],
			state.edgeIds.filter((e) => e !== id)
		);
	}
	return createSelection([...state.nodeIds], [...state.edgeIds, id]);
}

export function clearSelection(_state: SelectionState): SelectionState {
	return createSelection([], []);
}

export function isSelected(state: SelectionState, id: NodeId): boolean {
	return state.nodeIds.includes(id);
}

export function isEdgeSelected(state: SelectionState, id: EdgeId): boolean {
	return state.edgeIds.includes(id);
}
