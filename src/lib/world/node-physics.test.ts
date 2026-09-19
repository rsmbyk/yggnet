import { describe, expect, it } from 'vitest';
import {
	createNodePadding,
	findFreePosition,
	minCenterDistance,
	spheresOverlap
} from './node-physics';

describe('createNodePadding', () => {
	it('is twice the node radius so new centers sit at least four radii apart', () => {
		expect(createNodePadding(1)).toBe(2);
		expect(createNodePadding(2)).toBe(4);
	});
});

describe('findFreePosition with create padding', () => {
	const radius = 1;
	const padding = createNodePadding(radius);
	const floorY = 0;

	it('rejects a preferred spot closer than four radii from an existing node', () => {
		const preferred = { x: 3.9, y: 1, z: 0 };
		const blocker = { x: 0, y: 1, z: 0 };
		expect(spheresOverlap(preferred, blocker, radius, padding)).toBe(true);
		const placed = findFreePosition(preferred, [blocker], radius, floorY, padding);
		expect(spheresOverlap(placed, blocker, radius, padding)).toBe(false);
	});

	it('allows a preferred spot at exactly four radii (touching the min gap)', () => {
		const preferred = { x: 4, y: 1, z: 0 };
		const blocker = { x: 0, y: 1, z: 0 };
		expect(spheresOverlap(preferred, blocker, radius, padding)).toBe(false);
		expect(findFreePosition(preferred, [blocker], radius, floorY, padding)).toEqual(preferred);
	});

	it('puts the first search ring at the min center distance from preferred', () => {
		const preferred = { x: 0, y: 1, z: 0 };
		const step = minCenterDistance(radius, padding);
		expect(step).toBe(4);
		const placed = findFreePosition(preferred, [preferred], radius, floorY, padding);
		const dist = Math.hypot(placed.x - preferred.x, placed.z - preferred.z);
		expect(dist).toBeCloseTo(step);
		expect(spheresOverlap(placed, preferred, radius, padding)).toBe(false);
	});

	it('steps the next ring by another min center distance when the first ring is full', () => {
		const preferred = { x: 0, y: 1, z: 0 };
		const step = minCenterDistance(radius, padding);
		const firstRing: { x: number; y: number; z: number }[] = [];
		for (let i = 1; i <= 6; i++) {
			const ang = i * 2.399963;
			firstRing.push({
				x: preferred.x + Math.cos(ang) * step,
				y: preferred.y,
				z: preferred.z + Math.sin(ang) * step
			});
		}
		const placed = findFreePosition(preferred, [preferred, ...firstRing], radius, floorY, padding);
		const dist = Math.hypot(placed.x - preferred.x, placed.z - preferred.z);
		expect(dist).toBeCloseTo(step * 2);
	});
});
