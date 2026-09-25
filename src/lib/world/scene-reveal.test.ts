import { describe, expect, it } from 'vitest';
import {
	SCENE_REVEAL_EDGE_CHUNK,
	SCENE_REVEAL_NODE_CHUNK,
	sceneRevealComplete,
	sceneRevealShouldReset,
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

describe('sceneRevealShouldReset', () => {
	it('resets on first document and when the identity changes', () => {
		expect(sceneRevealShouldReset(null, 'doc-a')).toBe(true);
		expect(sceneRevealShouldReset('doc-a', 'doc-b')).toBe(true);
	});

	it('does not reset when the same document is replaced in place', () => {
		expect(sceneRevealShouldReset('doc-a', 'doc-a')).toBe(false);
	});
});
