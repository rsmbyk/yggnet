import { describe, expect, it } from 'vitest';
import {
	createNodePadding,
	findFreePosition,
	hexRingPosition,
	hexRingSlotCount,
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

	it('puts the first search ring at the min center distance on the +X spoke', () => {
		const preferred = { x: 0, y: 1, z: 0 };
		const step = minCenterDistance(radius, padding);
		expect(step).toBe(4);
		expect(hexRingSlotCount(1)).toBe(6);
		const placed = findFreePosition(preferred, [preferred], radius, floorY, padding);
		expect(placed.x).toBeCloseTo(step);
		expect(placed.z).toBeCloseTo(0);
		expect(spheresOverlap(placed, preferred, radius, padding)).toBe(false);
	});

	it('steps the next ring by another min center distance when the first ring is full', () => {
		const preferred = { x: 0, y: 1, z: 0 };
		const step = minCenterDistance(radius, padding);
		const firstRing = Array.from({ length: hexRingSlotCount(1) }, (_, slot) =>
			hexRingPosition(preferred, 1, slot, step)
		);
		expect(hexRingSlotCount(2)).toBe(12);
		const placed = findFreePosition(preferred, [preferred, ...firstRing], radius, floorY, padding);
		expect(placed).toEqual(hexRingPosition(preferred, 2, 0, step));
		const dist = Math.hypot(placed.x - preferred.x, placed.z - preferred.z);
		expect(dist).toBeCloseTo(step * 2);
	});

	it('keeps same-ring neighbors at least the min center distance apart', () => {
		const step = minCenterDistance(radius, padding);
		const a = hexRingPosition({ x: 0, y: 1, z: 0 }, 1, 0, step);
		const b = hexRingPosition({ x: 0, y: 1, z: 0 }, 1, 1, step);
		const chord = Math.hypot(a.x - b.x, a.z - b.z);
		expect(chord).toBeCloseTo(step);
	});
});
