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

	it('clears nodes through the toolbar toggle path', () => {
		app.setOpenTool('nodes');
		app.selectNodeWithModifiers('node-a');

		app.toggleTool('edges');

		expect(app.selection.nodeIds).toEqual([]);
		expect(app.ui.openTool).toBe('edges');
	});

	it('preserves selection when switching between non-Nodes tools', () => {
		app.setOpenTool('edges');
		app.selectNodeWithModifiers('node-a');
		app.selectNodeWithModifiers('node-b', 'add');

		app.setOpenTool('file');

		expect(app.selection.nodeIds).toEqual(['node-a', 'node-b']);
		expect(app.ui.multiSelectMode).toBe(true);
	});

	it('keeps edge selection and sticky multi-select when leaving Nodes with edges selected', () => {
		app.setOpenTool('nodes');
		app.selectEdgeWithModifiers('edge-a', 'add');
		expect(app.selection.nodeIds).toEqual([]);
		expect(app.ui.multiSelectMode).toBe(true);

		app.setOpenTool('edges');

		expect(app.selection.nodeIds).toEqual([]);
		expect(app.selection.edgeIds).toEqual(['edge-a']);
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

	it('clears edge selection when closing the open tool', () => {
		app.setOpenTool('edges');
		app.selectEdgeWithModifiers('edge-a', 'add');
		expect(app.ui.multiSelectMode).toBe(true);

		app.setOpenTool(null);

		expect(app.selection.edgeIds).toEqual([]);
		expect(app.ui.multiSelectMode).toBe(false);
	});
});
