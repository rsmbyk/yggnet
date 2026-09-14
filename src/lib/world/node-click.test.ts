import { describe, expect, it } from 'vitest';
import {
	interactionModeFromState,
	nodeClickActionFromMods,
	resolveNodeClick
} from './node-click';

describe('nodeClickActionFromMods', () => {
	it('plain click replaces selection', () => {
		expect(nodeClickActionFromMods({ alt: false, ctrl: false, shift: false })).toEqual({
			kind: 'select',
			mode: 'replace'
		});
	});

	it('ctrl click starts undirected connect', () => {
		expect(nodeClickActionFromMods({ alt: false, ctrl: true, shift: false })).toEqual({
			kind: 'startConnect',
			directed: false
		});
	});

	it('ctrl+alt click starts directed connect', () => {
		expect(nodeClickActionFromMods({ alt: true, ctrl: true, shift: false })).toEqual({
			kind: 'startConnect',
			directed: true
		});
	});

	it('shift click is add-only', () => {
		expect(nodeClickActionFromMods({ alt: false, ctrl: false, shift: true })).toEqual({
			kind: 'select',
			mode: 'add'
		});
	});
});

describe('interactionModeFromState', () => {
	it('connect wins over multi-select', () => {
		expect(
			interactionModeFromState({
				connecting: true,
				multiSelectMode: true,
				selectedNodeCount: 3
			})
		).toBe('connect');
	});

	it('sticky multi-select mode even with one node', () => {
		expect(
			interactionModeFromState({
				connecting: false,
				multiSelectMode: true,
				selectedNodeCount: 1
			})
		).toBe('multiSelect');
	});

	it('multi-select when 2+ nodes', () => {
		expect(
			interactionModeFromState({
				connecting: false,
				multiSelectMode: false,
				selectedNodeCount: 2
			})
		).toBe('multiSelect');
	});

	it('idle otherwise', () => {
		expect(
			interactionModeFromState({
				connecting: false,
				multiSelectMode: false,
				selectedNodeCount: 1
			})
		).toBe('idle');
	});
});

describe('resolveNodeClick', () => {
	it('connect mode always completes', () => {
		expect(resolveNodeClick({ alt: true, ctrl: true, shift: true }, 'connect')).toEqual({
			kind: 'completeConnect'
		});
	});

	it('multi-select: plain toggles; alt deselects', () => {
		expect(resolveNodeClick({ alt: false, ctrl: false, shift: false }, 'multiSelect')).toEqual({
			kind: 'select',
			mode: 'toggle'
		});
		expect(resolveNodeClick({ alt: true, ctrl: false, shift: false }, 'multiSelect')).toEqual({
			kind: 'select',
			mode: 'deselect'
		});
	});
});
