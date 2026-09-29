import { describe, expect, it } from 'vitest';
import {
	analysisGlyphScale,
	primaryAnalysisRole,
	revealDuration,
	revealProgress
} from './analysis-decoration';

describe('analysis decoration policy', () => {
	it('uses deterministic role priority', () => {
		expect(primaryAnalysisRole(['rejected', 'settled', 'frontier'])).toBe('frontier');
		expect(primaryAnalysisRole(['current', 'result', 'inspecting'])).toBe('result');
	});

	it('clamps glyph scale for near and far cameras', () => {
		expect(analysisGlyphScale(1)).toBe(0.85);
		expect(analysisGlyphScale(1000)).toBe(2.4);
		expect(analysisGlyphScale(20)).toBeGreaterThan(0.85);
	});

	it('bounds result reveal and supports immediate reduced motion', () => {
		expect(revealDuration(1)).toBe(800);
		expect(revealDuration(10_000)).toBe(3000);
		expect(revealProgress(revealDuration(10) / 2, 10, false)).toBeCloseTo(0.5);
		expect(revealProgress(0, 10, true)).toBe(1);
	});
});
