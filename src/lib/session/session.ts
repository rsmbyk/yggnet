import {
	createEmptyDocument,
	createSelection,
	type AppMode,
	type GraphDocument,
	type SelectionState
} from '$lib/graph';

export interface SessionState {
	document: GraphDocument;
	selection: SelectionState;
	mode: AppMode;
	directions: { fromId: string | null; toId: string | null; selectedPathId: string | null };
	analyze: { lastRunId: string | null; stepIndex: number };
}

export function createSession(title = 'Untitled'): SessionState {
	return {
		document: createEmptyDocument(title),
		selection: createSelection(),
		mode: 'explore',
		directions: { fromId: null, toId: null, selectedPathId: null },
		analyze: { lastRunId: null, stepIndex: 0 }
	};
}

export function setMode(session: SessionState, mode: AppMode): SessionState {
	return { ...session, mode };
}
