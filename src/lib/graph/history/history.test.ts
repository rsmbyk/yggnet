import { describe, expect, it } from 'vitest';
import { createEmptyDocument } from '../model/document';
import { addNode, removeNode, updateNode } from '../ops/ops';
import { clear, createHistory, execute, redo, undo } from './history';

describe('history', () => {
	it('createHistory starts empty', () => {
		const h = createHistory();
		expect(h.undoStack).toEqual([]);
		expect(h.redoStack).toEqual([]);
	});

	it('execute / undo / redo round-trip a mutation', () => {
		let history = createHistory();
		let doc = createEmptyDocument();

		({ history, doc } = execute(history, doc, (d) => {
			const { doc: next, nodeId } = addNode(d, { label: 'A' });
			return {
				doc: next,
				undo: (cur) => removeNode(cur, nodeId)
			};
		}));
		const nodeIds = Object.keys(doc.nodes);
		expect(nodeIds).toHaveLength(1);
		expect(history.undoStack).toHaveLength(1);
		expect(history.redoStack).toHaveLength(0);

		({ history, doc } = undo(history, doc));
		expect(Object.keys(doc.nodes)).toHaveLength(0);
		expect(history.undoStack).toHaveLength(0);
		expect(history.redoStack).toHaveLength(1);

		({ history, doc } = redo(history, doc));
		expect(Object.keys(doc.nodes)).toHaveLength(1);
		expect(history.undoStack).toHaveLength(1);
		expect(history.redoStack).toHaveLength(0);
	});

	it('undo/redo are no-ops on empty stacks', () => {
		const history = createHistory();
		const doc = createEmptyDocument();
		expect(undo(history, doc)).toEqual({ history, doc });
		expect(redo(history, doc)).toEqual({ history, doc });
	});

	it('execute clears redo stack', () => {
		let history = createHistory();
		let doc = createEmptyDocument();
		let id = '';

		({ history, doc } = execute(history, doc, (d) => {
			const r = addNode(d, { label: 'A' });
			id = r.nodeId;
			return { doc: r.doc, undo: (cur) => removeNode(cur, r.nodeId) };
		}));
		({ history, doc } = undo(history, doc));
		expect(history.redoStack).toHaveLength(1);

		({ history, doc } = execute(history, doc, (d) => {
			const r = addNode(d, { label: 'B' });
			return { doc: r.doc, undo: (cur) => removeNode(cur, r.nodeId) };
		}));
		expect(history.redoStack).toHaveLength(0);
		expect(Object.values(doc.nodes).map((n) => n.label)).toEqual(['B']);
		expect(id).toBeTruthy();
	});

	it('clear empties both stacks', () => {
		let history = createHistory();
		let doc = createEmptyDocument();
		({ history, doc } = execute(history, doc, (d) => {
			const r = addNode(d);
			return { doc: r.doc, undo: (cur) => removeNode(cur, r.nodeId) };
		}));
		({ history, doc } = execute(history, doc, (d) => {
			const id = Object.keys(d.nodes)[0];
			return {
				doc: updateNode(d, id, { label: 'X' }),
				undo: (cur) => updateNode(cur, id, { label: 'Node' })
			};
		}));
		history = clear(history);
		expect(history.undoStack).toEqual([]);
		expect(history.redoStack).toEqual([]);
		expect(Object.keys(doc.nodes)).toHaveLength(1);
	});
});
