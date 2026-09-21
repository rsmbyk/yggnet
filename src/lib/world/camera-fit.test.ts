import { describe, expect, it } from 'vitest';
import {
	centroid,
	farPlaneForOrbitDistance,
	orbitDistanceToFitPoint,
	orbitDistanceToFitPoints,
	projectOrbitPoint
} from './camera-fit';

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

	it('does not exceed a finite maxDistance', () => {
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

	it('zooms out past 200 when maxDistance is unbounded', () => {
		const d = orbitDistanceToFitPoint({
			target,
			eye,
			point: { x: 400, y: 1, z: 0 },
			up,
			fovDeg: 50,
			aspect: 16 / 9,
			radius: 1,
			minDistance: 2,
			maxDistance: Infinity
		});
		expect(d).toBeGreaterThan(200);
		expect(d).toBeGreaterThanOrEqual(2);
		const current = Math.hypot(10, 10);
		const eyeAt = {
			x: (eye.x / current) * d,
			y: (eye.y / current) * d,
			z: (eye.z / current) * d
		};
		const proj = projectOrbitPoint(target, eyeAt, { x: 400, y: 1, z: 0 }, up, 50, 16 / 9);
		expect(proj).not.toBeNull();
		expect(Math.abs(proj!.ndcX)).toBeLessThanOrEqual(0.9 + 1e-6);
		expect(Math.abs(proj!.ndcY)).toBeLessThanOrEqual(0.9 + 1e-6);
	});
});

describe('farPlaneForOrbitDistance', () => {
	it('keeps the default far until orbit outruns it', () => {
		expect(farPlaneForOrbitDistance(50, 500)).toBe(500);
		expect(farPlaneForOrbitDistance(400, 500)).toBeGreaterThan(500);
	});
});

describe('centroid', () => {
	it('returns null for an empty cloud', () => {
		expect(centroid([])).toBeNull();
	});

	it('averages point positions', () => {
		expect(
			centroid([
				{ x: 2, y: 0, z: 0 },
				{ x: 0, y: 2, z: 0 }
			])
		).toEqual({
			x: 1,
			y: 1,
			z: 0
		});
	});
});

describe('orbitDistanceToFitPoints', () => {
	const base = {
		target,
		eye,
		up,
		fovDeg: 50,
		aspect: 16 / 9,
		radius: 1,
		minDistance: 2,
		maxDistance: 200
	};

	it('zooms in on a tight cluster around the target', () => {
		const d = orbitDistanceToFitPoints({
			...base,
			points: [
				{ x: 0, y: 1, z: 0 },
				{ x: 1, y: 1, z: 0 }
			]
		});
		expect(d).toBeLessThan(Math.hypot(10, 10));
		expect(d).toBeGreaterThanOrEqual(2);
	});

	it('zooms out until a wide cloud fits', () => {
		const d = orbitDistanceToFitPoints({
			...base,
			points: [
				{ x: 40, y: 1, z: 0 },
				{ x: -40, y: 1, z: 0 }
			]
		});
		expect(d).toBeGreaterThan(Math.hypot(10, 10));
		const eyeAt = {
			x: (eye.x / Math.hypot(10, 10)) * d,
			y: (eye.y / Math.hypot(10, 10)) * d,
			z: (eye.z / Math.hypot(10, 10)) * d
		};
		for (const point of [
			{ x: 40, y: 1, z: 0 },
			{ x: -40, y: 1, z: 0 }
		]) {
			const proj = projectOrbitPoint(target, eyeAt, point, up, 50, 16 / 9);
			expect(proj).not.toBeNull();
			expect(Math.abs(proj!.ndcX)).toBeLessThanOrEqual(0.9 + 1e-6);
			expect(Math.abs(proj!.ndcY)).toBeLessThanOrEqual(0.9 + 1e-6);
		}
	});

	it('returns the current clamped distance when there are no points', () => {
		const d = orbitDistanceToFitPoints({ ...base, points: [] });
		expect(d).toBeCloseTo(Math.hypot(10, 10));
	});
});
