/** Selection mode for a node click. */
export type NodeSelectMode = 'replace' | 'toggle' | 'add' | 'deselect';

/** Exclusive world interaction modes — one active at a time. */
export type InteractionMode = 'idle' | 'connect' | 'multiSelect';

/** Resolved LMB click intent from modifier keys + active mode. */
export type NodeClickAction =
	| { kind: 'select'; mode: NodeSelectMode }
	| { kind: 'completeConnect' }
	/** Ctrl+click (no drag): start connect from selection / this node. */
	| { kind: 'startConnect'; directed: boolean };

export function interactionModeFromState(state: {
	connecting: boolean;
	multiSelectMode: boolean;
	selectedNodeCount: number;
}): InteractionMode {
	if (state.connecting) return 'connect';
	if (state.multiSelectMode || state.selectedNodeCount > 1) return 'multiSelect';
	return 'idle';
}

/**
 * Idle modifier map (click, no drag):
 * Ctrl → start connect (Alt → directed). Shift → add (enter sticky multi).
 * Plain → replace.
 */
export function nodeClickActionFromMods(mods: {
	alt: boolean;
	ctrl: boolean;
	shift: boolean;
}): NodeClickAction {
	if (mods.ctrl) return { kind: 'startConnect', directed: mods.alt };
	if (mods.shift) return { kind: 'select', mode: 'add' };
	return { kind: 'select', mode: 'replace' };
}

/**
 * Resolve node click for the active interaction mode.
 * Multi-select: plain/toggle; Alt → deselect only. Connect mode completes.
 */
export function resolveNodeClick(
	mods: { alt: boolean; ctrl: boolean; shift: boolean },
	mode: InteractionMode
): NodeClickAction {
	if (mode === 'connect') return { kind: 'completeConnect' };
	if (mode === 'multiSelect') {
		if (mods.alt) return { kind: 'select', mode: 'deselect' };
		return { kind: 'select', mode: 'toggle' };
	}
	return nodeClickActionFromMods(mods);
}
