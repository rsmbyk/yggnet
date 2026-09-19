import { describe, expect, it } from 'vitest';
import { orbitDistanceToFitPoint, projectOrbitPoint } from './camera-fit';

const target = { x: 0, y: 0, z: 0 };
const eye = { x: 0, y: 10, z: 10 };
const up = { x: 0, y: 1, z: 0 };

describe('orbitDistanceToFitPoint', () => {
	it('keeps the current distance when the point is already on screen', () => {
		const d = orbitDistanceToFitPoint({
			target,
			eye,
			point: { x: 0, y: 1, z: 0 },
			up,
			fovDeg: 50,
			aspect: 16 / 9,
			radius: 1,
			minDistance: 2,
			maxDistance: 200
		});
		expect(d).toBeCloseTo(Math.hypot(10, 10));
	});

	it('zooms out when a point sits off the frame, but never zooms in', () => {
		const current = Math.hypot(10, 10);
		const d = orbitDistanceToFitPoint({
			target,
			eye,
			point: { x: 40, y: 1, z: 0 },
			up,
			fovDeg: 50,
			aspect: 16 / 9,
			radius: 1,
			minDistance: 2,
			maxDistance: 200
		});
		expect(d).toBeGreaterThan(current);
		const proj = projectOrbitPoint(
			target,
			{
				x: (eye.x / current) * d,
				y: (eye.y / current) * d,
				z: (eye.z / current) * d
			},
			{ x: 40, y: 1, z: 0 },
			up,
			50,
			16 / 9
		);
		expect(proj).not.toBeNull();
		expect(Math.abs(proj!.ndcX)).toBeLessThanOrEqual(0.9 + 1e-6);
		expect(Math.abs(proj!.ndcY)).toBeLessThanOrEqual(0.9 + 1e-6);
	});

	it('does not exceed maxDistance', () => {
		const d = orbitDistanceToFitPoint({
			target,
			eye,
			point: { x: 400, y: 1, z: 0 },
			up,
			fovDeg: 50,
			aspect: 16 / 9,
			radius: 1,
			minDistance: 2,
			maxDistance: 80
		});
		expect(d).toBe(80);
	});
});
