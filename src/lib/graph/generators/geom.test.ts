import { describe, expect, it } from 'vitest';
import { dist, enforceMinDistance, GENERATE_MIN_DISTANCE, vec } from './geom';

describe('enforceMinDistance', () => {
	it('leaves already-spaced points unchanged', () => {
		const a = vec(0, 0, 0);
		const b = vec(GENERATE_MIN_DISTANCE, 0, 0);
		const out = enforceMinDistance([a, b]);
		expect(out).toEqual([a, b]);
	});

	it('scales a tight regular pair about the centroid', () => {
		const out = enforceMinDistance([vec(-1, 0, 0), vec(1, 0, 0)]);
		expect(dist(out[0], out[1])).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
		expect(out[0].y).toBe(0);
		expect(out[1].y).toBe(0);
		expect((out[0].x + out[1].x) / 2).toBeCloseTo(0);
	});

	it('separates coincident points in 3D', () => {
		const out = enforceMinDistance([vec(0, 1, 0), vec(0, 1, 0), vec(0, 1, 0)]);
		expect(dist(out[0], out[1])).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
		expect(dist(out[0], out[2])).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
		expect(dist(out[1], out[2])).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
	});
});
