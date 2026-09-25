import * as THREE from 'three';

/** Width/height segments for every node sphere (matches the old per-mesh geometry). */
export const NODE_SPHERE_SEGMENTS = 24;

/**
 * One shared unit sphere. Node meshes scale it to the live `nodeRadius`
 * instead of allocating a new `SphereGeometry` per node.
 */
export function createNodeSphereGeometry(): THREE.SphereGeometry {
	return new THREE.SphereGeometry(1, NODE_SPHERE_SEGMENTS, NODE_SPHERE_SEGMENTS);
}
