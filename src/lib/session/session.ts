import {
	createEmptyDocument,
	createSelection,
	type GraphDocument,
	type SelectionState
} from '$lib/graph';

export interface SessionState {
	document: GraphDocument;
	selection: SelectionState;
	directions: { fromId: string | null; toId: string | null; selectedPathId: string | null };
	analyze: { lastRunId: string | null; stepIndex: number };
}

export function createSession(title = 'Untitled'): SessionState {
	return {
		document: createEmptyDocument(title),
		selection: createSelection(),
		directions: { fromId: null, toId: null, selectedPathId: null },
		analyze: { lastRunId: null, stepIndex: 0 }
	};
}
