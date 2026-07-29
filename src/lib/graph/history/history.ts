import type { GraphDocument } from '../model/types';

export type UndoFn = (doc: GraphDocument) => GraphDocument;
export type RedoFn = (doc: GraphDocument) => GraphDocument;

export interface HistoryCommand {
	undo: UndoFn;
	redo: RedoFn;
}

export interface History {
	undoStack: HistoryCommand[];
	redoStack: HistoryCommand[];
}

export type MutateFn = (doc: GraphDocument) => {
	doc: GraphDocument;
	undo: UndoFn;
};

export function createHistory(): History {
	return { undoStack: [], redoStack: [] };
}

/**
 * Apply a mutation that already returns its inverse.
 * Forward was produced by `mutateFn`; undo stack stores that inverse + a redo that restores the post-mutation doc.
 * Clears the redo stack (new branch of history).
 */
export function execute(
	history: History,
	doc: GraphDocument,
	mutateFn: MutateFn
): { history: History; doc: GraphDocument } {
	const { doc: nextDoc, undo } = mutateFn(doc);
	const after = nextDoc;
	const command: HistoryCommand = {
		undo,
		redo: () => after
	};
	return {
		history: {
			undoStack: [...history.undoStack, command],
			redoStack: []
		},
		doc: nextDoc
	};
}

export function undo(
	history: History,
	doc: GraphDocument
): { history: History; doc: GraphDocument } {
	if (history.undoStack.length === 0) {
		return { history, doc };
	}
	const command = history.undoStack[history.undoStack.length - 1];
	const prevDoc = command.undo(doc);
	const redoCommand: HistoryCommand = {
		undo: command.undo,
		redo: () => doc
	};
	return {
		history: {
			undoStack: history.undoStack.slice(0, -1),
			redoStack: [...history.redoStack, redoCommand]
		},
		doc: prevDoc
	};
}

export function redo(
	history: History,
	doc: GraphDocument
): { history: History; doc: GraphDocument } {
	if (history.redoStack.length === 0) {
		return { history, doc };
	}
	const command = history.redoStack[history.redoStack.length - 1];
	const nextDoc = command.redo(doc);
	const undoCommand: HistoryCommand = {
		undo: command.undo,
		redo: () => nextDoc
	};
	return {
		history: {
			undoStack: [...history.undoStack, undoCommand],
			redoStack: history.redoStack.slice(0, -1)
		},
		doc: nextDoc
	};
}

export function clear(history: History): History {
	return { undoStack: [], redoStack: [] };
}
