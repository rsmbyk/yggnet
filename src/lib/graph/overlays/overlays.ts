export type OverlayKind = 'path' | 'algo' | 'compare' | 'filter' | 'none';

export interface Overlay {
	kind: OverlayKind;
	nodeIds: string[];
	edgeIds: string[];
	dimOthers: boolean;
}

export function createEmptyOverlay(): Overlay {
	return {
		kind: 'none',
		nodeIds: [],
		edgeIds: [],
		dimOthers: false
	};
}

/** Highlight a path; dims everything else by default. */
export function pathOverlay(nodeIds: string[], edgeIds: string[]): Overlay {
	return {
		kind: 'path',
		nodeIds: [...nodeIds],
		edgeIds: [...edgeIds],
		dimOthers: true
	};
}
