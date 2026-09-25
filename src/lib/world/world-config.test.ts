import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { WORLD, defaultCameraPosition } from './world-config';

describe('WORLD canonical config', () => {
	it('freezes grid texture size at 250', () => {
		expect(WORLD.grid.textureSize).toBe(250);
	});

	it('keeps groundSize at 10000 after vibe freeze', () => {
		expect(WORLD.groundSize).toBe(10000);
	});

	it('defaultCameraPosition matches isometric formula from distance + elevation', () => {
		const [x, y, z] = defaultCameraPosition(50, 50);
		const elev = (50 * Math.PI) / 180;
		const xz = (50 * Math.sin(elev)) / Math.SQRT2;
		const expectedY = 50 * Math.cos(elev);
		expect(x).toBeCloseTo(xz, 10);
		expect(y).toBeCloseTo(expectedY, 10);
		expect(z).toBeCloseTo(xz, 10);
		expect(Math.hypot(x, y, z)).toBeCloseTo(50, 10);
	});

	it('defaultCameraPosition defaults match WORLD.camera.defaultPosition', () => {
		const computed = defaultCameraPosition();
		expect(computed[0]).toBeCloseTo(WORLD.camera.defaultPosition[0], 10);
		expect(computed[1]).toBeCloseTo(WORLD.camera.defaultPosition[1], 10);
		expect(computed[2]).toBeCloseTo(WORLD.camera.defaultPosition[2], 10);
	});

	it('docs/world-scale.md records every frozen value we assert in SPECs', () => {
		const doc = readFileSync(resolve('docs/world-scale.md'), 'utf8');
		expect(doc).toContain('**10000**');
		expect(doc).toContain('**250**');
		expect(doc).toContain('**50**');
		expect(doc).toContain('labelDistance');
		expect(doc).toContain('collision.snapStep');
		expect(doc).toContain('controls.viewModeTransitionMs');
		expect(doc).toContain('**0.05**'); // previewShaftRadius
		expect(doc).not.toMatch(/World Tune/i);
	});

	it('freezes node palette and label distance for SPEC-043', () => {
		expect(WORLD.nodeColor).toBe('#7a8a9a');
		expect(WORLD.nodeSelectedColor).toBe('#c4a35a');
		expect(WORLD.nodeHoverColor).toBe('#6eb0c8');
		expect(WORLD.labelDistance).toBe(50);
		expect(WORLD.edges.shaftRadius).toBe(0.1);
		expect(WORLD.edges.previewShaftRadius).toBe(0.05);
		expect(WORLD.edges.arrowHeight).toBe(1);
		expect(WORLD.edges.arrowRadius).toBe(0.3);
		expect(WORLD.edges.arrowGapFraction).toBe(0.2);
	});
});
