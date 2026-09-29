type EdgeWithId = { id: string };

export function partitionEdgesByDimming<T extends EdgeWithId>(
	edges: readonly T[],
	matchingEdgeIds: ReadonlySet<string>,
	dimOthers: boolean
): { opaque: T[]; dimmed: T[] } {
	if (!dimOthers) return { opaque: [...edges], dimmed: [] };

	const opaque: T[] = [];
	const dimmed: T[] = [];
	for (const edge of edges) {
		if (matchingEdgeIds.has(edge.id)) opaque.push(edge);
		else dimmed.push(edge);
	}
	return { opaque, dimmed };
}
