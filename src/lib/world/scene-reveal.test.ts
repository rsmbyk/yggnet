import { describe, expect, it } from 'vitest';
import {
	SCENE_REVEAL_EDGE_CHUNK,
	SCENE_REVEAL_NODE_CHUNK,
	sceneRevealComplete,
	stepSceneReveal
} from './scene-reveal';

describe('stepSceneReveal', () => {
	it('advances nodes and edges by their chunks without passing the totals', () => {
		expect(stepSceneReveal({ nodes: 0, edges: 0 }, { nodes: 100, edges: 1024 })).toEqual({
			nodes: SCENE_REVEAL_NODE_CHUNK,
			edges: SCENE_REVEAL_EDGE_CHUNK
		});
		expect(stepSceneReveal({ nodes: 96, edges: 1000 }, { nodes: 100, edges: 1024 })).toEqual({
			nodes: 100,
			edges: 1024
		});
	});

	it('stays put when everything is already shown', () => {
		const shown = { nodes: 12, edges: 40 };
		expect(stepSceneReveal(shown, shown)).toEqual(shown);
	});
});

describe('sceneRevealComplete', () => {
	it('is true only when both counts have caught up', () => {
		expect(sceneRevealComplete({ nodes: 10, edges: 10 }, { nodes: 10, edges: 10 })).toBe(true);
		expect(sceneRevealComplete({ nodes: 9, edges: 10 }, { nodes: 10, edges: 10 })).toBe(false);
	});
});
