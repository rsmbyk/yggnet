/** How many node meshes to mount per animation frame while a graph streams in. */
export const SCENE_REVEAL_NODE_CHUNK = 12;

/** How many edge meshes to mount per animation frame while a graph streams in. */
export const SCENE_REVEAL_EDGE_CHUNK = 48;

export type SceneReveal = {
	nodes: number;
	edges: number;
};

/** True when the visible mesh counts have caught up to the document. */
export function sceneRevealComplete(shown: SceneReveal, totals: SceneReveal): boolean {
	return shown.nodes >= totals.nodes && shown.edges >= totals.edges;
}

/**
 * Advance one frame of streamed scene construction so the canvas can paint
 * before every node and edge mesh exists.
 */
export function stepSceneReveal(
	shown: SceneReveal,
	totals: SceneReveal,
	nodeChunk = SCENE_REVEAL_NODE_CHUNK,
	edgeChunk = SCENE_REVEAL_EDGE_CHUNK
): SceneReveal {
	return {
		nodes: Math.min(totals.nodes, shown.nodes + nodeChunk),
		edges: Math.min(totals.edges, shown.edges + edgeChunk)
	};
}
