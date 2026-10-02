import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
	composeEdgeArrowMatrix,
	composeEdgeShaftMatrix,
	edgePose,
	instanceCapacity,
	instanceTint
} from './edge-pose';

describe('edgePose', () => {
	it('aligns a vertical edge with the unit cylinder (+Y)', () => {
		const pose = edgePose({ x: 0, y: 0, z: 0 }, { x: 0, y: 4, z: 0 });
		expect(pose.len).toBeCloseTo(4);
		expect(pose.mid).toEqual({ x: 0, y: 2, z: 0 });
		expect(pose.quaternion[0]).toBeCloseTo(0);
		expect(pose.quaternion[1]).toBeCloseTo(0);
		expect(pose.quaternion[2]).toBeCloseTo(0);
		expect(pose.quaternion[3]).toBeCloseTo(1);
	});

	it('flips 180° around X when the edge points down -Y', () => {
		const pose = edgePose({ x: 0, y: 2, z: 0 }, { x: 0, y: 0, z: 0 });
		expect(pose.len).toBeCloseTo(2);
		expect(pose.quaternion[0]).toBeCloseTo(1);
		expect(pose.quaternion[3]).toBeCloseTo(0);
	});
});

describe('composeEdgeShaftMatrix', () => {
	it('places a unit-Y cylinder on the segment with scale.y = length', () => {
		const pose = edgePose({ x: 0, y: 0, z: 0 }, { x: 0, y: 6, z: 0 });
		const m = composeEdgeShaftMatrix(pose, new THREE.Matrix4());
		const pos = new THREE.Vector3();
		const quat = new THREE.Quaternion();
		const scale = new THREE.Vector3();
		m.decompose(pos, quat, scale);
		expect(pos.y).toBeCloseTo(3);
		expect(scale.y).toBeCloseTo(6);
		expect(scale.x).toBeCloseTo(1);
	});
});

describe('composeEdgeArrowMatrix', () => {
	it('sits the cone back from the destination along the edge', () => {
		const from = { x: 0, y: 0, z: 0 };
		const to = { x: 0, y: 10, z: 0 };
		const pose = edgePose(from, to);
		const m = composeEdgeArrowMatrix(to, pose, 2, 0.1, new THREE.Matrix4());
		const pos = new THREE.Vector3();
		m.decompose(pos, new THREE.Quaternion(), new THREE.Vector3());
		expect(pos.y).toBeCloseTo(9);
	});
});

describe('instanceTint', () => {
	it('keeps the edge color at full opacity', () => {
		const c = instanceTint('#ff0000', 1, '#000000');
		expect(c.r).toBeCloseTo(1);
		expect(c.g).toBeCloseTo(0);
	});

	it('mixes toward the background as opacity falls', () => {
		const c = instanceTint('#ffffff', 0, '#000000');
		expect(c.r).toBeCloseTo(0);
		expect(c.g).toBeCloseTo(0);
		expect(c.b).toBeCloseTo(0);
	});
});

describe('instanceCapacity', () => {
	it('grows to the next power of two when the mesh is too small', () => {
		expect(instanceCapacity(9, 8)).toBe(16);
		expect(instanceCapacity(8, 8)).toBe(8);
		expect(instanceCapacity(0, 8)).toBe(8);
	});
});
