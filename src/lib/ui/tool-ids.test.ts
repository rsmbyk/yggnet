import { describe, expect, it } from 'vitest';
import { nextOpenTool, toolLabel } from './tool-ids';

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
	});
});
