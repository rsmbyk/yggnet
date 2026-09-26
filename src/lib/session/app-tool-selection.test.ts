import { beforeEach, describe, expect, it } from 'vitest';
import { app } from './app.svelte';

describe('tool switching and node selection', () => {
	beforeEach(() => {
		app.setOpenTool(null);
		app.clearAllSelection();
	});

	it('clears node selection and sticky multi-select when leaving Nodes', () => {
		app.setOpenTool('nodes');
		app.selectNodeWithModifiers('node-a');
		app.selectNodeWithModifiers('node-b', 'add');
		expect(app.ui.multiSelectMode).toBe(true);

		app.setOpenTool('edges');

		expect(app.selection.nodeIds).toEqual([]);
		expect(app.ui.multiSelectMode).toBe(false);
	});

	it('preserves selection when switching between non-Nodes tools', () => {
		app.setOpenTool('edges');
		app.selectNodeWithModifiers('node-a');
		app.selectNodeWithModifiers('node-b', 'add');

		app.setOpenTool('file');

		expect(app.selection.nodeIds).toEqual(['node-a', 'node-b']);
		expect(app.ui.multiSelectMode).toBe(true);
	});

	it('clears all selection when closing the open tool', () => {
		app.setOpenTool('nodes');
		app.selectNodeWithModifiers('node-a');
		app.selectNodeWithModifiers('node-b', 'add');

		app.setOpenTool(null);

		expect(app.selection.nodeIds).toEqual([]);
		expect(app.ui.multiSelectMode).toBe(false);
	});
});
