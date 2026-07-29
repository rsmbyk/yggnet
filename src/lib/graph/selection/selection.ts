import type { NodeId } from '../model/types';

export interface SelectionState {
	nodeIds: readonly NodeId[];
}

export function createSelection(nodeIds: NodeId[] = []): SelectionState {
	return { nodeIds: Object.freeze([...nodeIds]) };
}

export function selectNode(state: SelectionState, id: NodeId): SelectionState {
	return createSelection([id]);
}

export function clearSelection(_state: SelectionState): SelectionState {
	return createSelection([]);
}

export function isSelected(state: SelectionState, id: NodeId): boolean {
	return state.nodeIds.includes(id);
}
