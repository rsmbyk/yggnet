import { beforeEach, describe, expect, it } from 'vitest';
import { createEmptyDocument } from '$lib/graph';
import { app } from './app.svelte';

describe('document tag focus lifecycle', () => {
	beforeEach(() => {
		app.replaceDocument(createEmptyDocument());
		app.setFocusTags([]);
		app.setEditingTag(null);
	});

	it('replaceDocument clears focus and the tag being edited', () => {
		app.setFocusTags(['ghost']);
		app.setEditingTag('ghost');
		expect(app.filters.tags).toEqual(['ghost']);
		expect(app.ui.editingTag).toBe('ghost');

		app.replaceDocument(createEmptyDocument());

		expect(app.filters.tags).toEqual([]);
		expect(app.ui.editingTag).toBeNull();
	});

	it('deleteDocumentTag drops stale focus and editor for a present tag', () => {
		const id = app.addNode({ label: 'A' });
		app.setNodeTags(id, ['doomed']);

		app.deleteDocumentTag('doomed');

		expect(app.filters.tags).toEqual([]);
		expect(app.ui.editingTag).toBeNull();
	});

	it('deleteDocumentTag does not record undo for an absent tag', () => {
		const id = app.addNode({ label: 'A' });
		app.setNodeTags(id, ['kept']);
		const depthBefore = app.history.undoStack.length;

		app.deleteDocumentTag('never-existed');

		expect(app.history.undoStack.length).toBe(depthBefore);
		expect(app.document.nodes[id].tags).toEqual(['kept']);
	});
});
