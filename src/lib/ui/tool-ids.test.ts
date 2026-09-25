import { describe, expect, it } from 'vitest';
import {
	edgesCompanionOpen,
	nextOpenTool,
	nodesCompanionOpen,
	selectionPanelOpen,
	tagsCompanionOpen,
	toolLabel
} from './tool-ids';

describe('nextOpenTool', () => {
	it('opens a tool when none is open', () => {
		expect(nextOpenTool(null, 'nodes')).toBe('nodes');
	});

	it('closes the tool when it is clicked again', () => {
		expect(nextOpenTool('nodes', 'nodes')).toBe(null);
	});

	it('switches to a different tool', () => {
		expect(nextOpenTool('nodes', 'file')).toBe('file');
	});
});

describe('toolLabel', () => {
	it('returns the section title', () => {
		expect(toolLabel('pathfinder')).toBe('Pathfinder');
		expect(toolLabel('tags')).toBe('Tags');
	});
});

describe('selectionPanelOpen', () => {
	it('opens when a node is selected and no tool is open', () => {
		expect(selectionPanelOpen(null, 1, 0)).toBe(true);
	});

	it('opens when an edge is selected and no tool is open', () => {
		expect(selectionPanelOpen(null, 0, 1)).toBe(true);
	});

	it('stays closed when nothing is selected', () => {
		expect(selectionPanelOpen(null, 0, 0)).toBe(false);
	});

	it('hides while a tools panel is open', () => {
		expect(selectionPanelOpen('nodes', 1, 0)).toBe(false);
	});
});

describe('nodesCompanionOpen', () => {
	it('opens beside Nodes when exactly one node is selected', () => {
		expect(nodesCompanionOpen('nodes', 1)).toBe(true);
	});

	it('stays closed for multi-select or other tools', () => {
		expect(nodesCompanionOpen('nodes', 2)).toBe(false);
		expect(nodesCompanionOpen('nodes', 0)).toBe(false);
		expect(nodesCompanionOpen('file', 1)).toBe(false);
		expect(nodesCompanionOpen(null, 1)).toBe(false);
	});
});

describe('edgesCompanionOpen', () => {
	it('opens beside Edges when exactly one edge is selected', () => {
		expect(edgesCompanionOpen('edges', 1)).toBe(true);
	});

	it('stays closed for multi-select or other tools', () => {
		expect(edgesCompanionOpen('edges', 2)).toBe(false);
		expect(edgesCompanionOpen('edges', 0)).toBe(false);
		expect(edgesCompanionOpen('nodes', 1)).toBe(false);
		expect(edgesCompanionOpen(null, 1)).toBe(false);
	});
});

describe('tagsCompanionOpen', () => {
	it('opens beside Tags when a tag is being edited', () => {
		expect(tagsCompanionOpen('tags', 'alpha')).toBe(true);
	});

	it('stays closed without an editing tag or other tools', () => {
		expect(tagsCompanionOpen('tags', null)).toBe(false);
		expect(tagsCompanionOpen('nodes', 'alpha')).toBe(false);
		expect(tagsCompanionOpen(null, 'alpha')).toBe(false);
	});
});
