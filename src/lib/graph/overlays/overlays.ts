export type OverlayKind = 'path' | 'algo' | 'compare' | 'filter' | 'none';

/** One algorithm path series when overlay.kind is `compare`. */
export interface OverlaySeries {
	nodeIds: string[];
	edgeIds: string[];
}

export interface Overlay {
	kind: OverlayKind;
	nodeIds: string[];
	edgeIds: string[];
	dimOthers: boolean;
	/** Dual compare: series A (primary algorithm). */
	seriesA?: OverlaySeries;
	/** Dual compare: series B (secondary algorithm). */
	seriesB?: OverlaySeries;
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

function copySeries(series: OverlaySeries): OverlaySeries {
	return { nodeIds: [...series.nodeIds], edgeIds: [...series.edgeIds] };
}

/** Dual compare overlay with distinguishable series A and B. */
export function compareOverlay(seriesA: OverlaySeries, seriesB: OverlaySeries): Overlay {
	const nodeIds = [...new Set([...seriesA.nodeIds, ...seriesB.nodeIds])];
	const edgeIds = [...new Set([...seriesA.edgeIds, ...seriesB.edgeIds])];
	return {
		kind: 'compare',
		nodeIds,
		edgeIds,
		dimOthers: true,
		seriesA: copySeries(seriesA),
		seriesB: copySeries(seriesB)
	};
}

/** Path length (hops) and summed edge weight for a path overlay series. */
export function pathSeriesMetrics(
	edgeIds: string[],
	edgeWeights: Record<string, number | undefined>
): { hops: number; cost: number } {
	const hops = edgeIds.length;
	const cost = edgeIds.reduce((sum, id) => sum + (edgeWeights[id] ?? 0), 0);
	return { hops, cost };
}
