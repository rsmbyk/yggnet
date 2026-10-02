import { describe, expect, it } from 'vitest';
import { NODE_SPHERE_SEGMENTS, createNodeSphereGeometry } from './node-sphere';

describe('createNodeSphereGeometry', () => {
	it('is a unit sphere so node meshes can scale to the live radius', () => {
		const geo = createNodeSphereGeometry();
		expect(geo.parameters.radius).toBe(1);
		expect(geo.parameters.widthSegments).toBe(NODE_SPHERE_SEGMENTS);
		expect(geo.parameters.heightSegments).toBe(NODE_SPHERE_SEGMENTS);
		geo.dispose();
	});
});
