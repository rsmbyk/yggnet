import { describe, expect, it } from 'vitest';
import {
	edgeDirectionMode,
	edgeDirectionOptions,
	edgeDirectionPatch,
	edgeDirectionSelectValue
} from './edge-direction';

describe('edgeDirectionMode', () => {
	it('maps directed false to undirected and true to forward', () => {
		expect(edgeDirectionMode({ directed: false })).toBe('undirected');
		expect(edgeDirectionMode({ directed: true })).toBe('forward');
	});
});

describe('edgeDirectionPatch', () => {
	const edge = { from: 'a', to: 'b', directed: false };

	it('undirected clears directed without swapping', () => {
		expect(edgeDirectionPatch({ ...edge, directed: true }, 'undirected')).toEqual({
			directed: false
		});
	});

	it('forward keeps endpoints and forces directed', () => {
		expect(edgeDirectionPatch(edge, 'forward')).toEqual({
			directed: true,
			from: 'a',
			to: 'b'
		});
	});

	it('reverse swaps endpoints and forces directed', () => {
		expect(edgeDirectionPatch(edge, 'reverse')).toEqual({
			directed: true,
			from: 'b',
			to: 'a'
		});
	});
});

describe('edgeDirectionOptions', () => {
	it('labels undirected and both arrow directions', () => {
		expect(edgeDirectionOptions('N1', 'N2')).toEqual([
			{ value: 'undirected', label: 'Undirected' },
			{ value: 'forward', label: 'N1 → N2' },
			{ value: 'reverse', label: 'N2 → N1' }
		]);
	});
});

describe('edgeDirectionSelectValue', () => {
	it('never reports reverse after apply (stored edge is always forward or undirected)', () => {
		expect(edgeDirectionSelectValue({ directed: false })).toBe('undirected');
		expect(edgeDirectionSelectValue({ directed: true })).toBe('forward');
	});
});
