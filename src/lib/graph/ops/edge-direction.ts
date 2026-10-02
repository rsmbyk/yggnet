import type { GraphEdge, NodeId } from '../model/types';
import type { EdgePatch } from './ops';

/** UI / apply modes for an edge’s direction relative to its stored endpoints. */
export type EdgeDirectionMode = 'undirected' | 'forward' | 'reverse';

/** Read the current direction mode from a stored edge. */
export function edgeDirectionMode(edge: Pick<GraphEdge, 'directed'>): EdgeDirectionMode {
	return edge.directed ? 'forward' : 'undirected';
}

/**
 * Build an edge patch for a direction mode.
 * `reverse` swaps endpoints and forces directed; `forward` keeps them and forces directed;
 * `undirected` clears directed without swapping.
 */
export function edgeDirectionPatch(
	edge: Pick<GraphEdge, 'from' | 'to' | 'directed'>,
	mode: EdgeDirectionMode
): EdgePatch {
	if (mode === 'undirected') {
		return { directed: false };
	}
	if (mode === 'forward') {
		return { directed: true, from: edge.from, to: edge.to };
	}
	return { directed: true, from: edge.to, to: edge.from };
}

/** Dropdown option values for an edge given endpoint labels. */
export function edgeDirectionOptions(
	fromLabel: string,
	toLabel: string
): { value: EdgeDirectionMode; label: string }[] {
	return [
		{ value: 'undirected', label: 'Undirected' },
		{ value: 'forward', label: `${fromLabel} → ${toLabel}` },
		{ value: 'reverse', label: `${toLabel} → ${fromLabel}` }
	];
}

/** Resolve which select value is selected after a reverse swap (always `forward` when directed). */
export function edgeDirectionSelectValue(
	edge: Pick<GraphEdge, 'directed'>
): Exclude<EdgeDirectionMode, 'reverse'> {
	return edge.directed ? 'forward' : 'undirected';
}

/** Type helper so callers can pass node ids when building labels. */
export type EdgeEndpoints = { from: NodeId; to: NodeId };
