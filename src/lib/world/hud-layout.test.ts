import { describe, expect, it } from 'vitest';
import {
	availableHudWidth,
	centeredBannerOverlapsChrome,
	chromeContentWidth,
	tooSmallMediaMaxWidth,
	viewportTooSmallForChrome
} from './hud-layout';

describe('centeredBannerOverlapsChrome', () => {
	it('stays on the toolbar row when the centered banner clears the chrome', () => {
		expect(
			centeredBannerOverlapsChrome({
				chromeRight: 180,
				rowLeft: 12,
				rowWidth: 1000,
				bannerWidth: 450
			})
		).toBe(false);
	});

	it('drops under the toolbar when the centered banner would hit the chrome', () => {
		expect(
			centeredBannerOverlapsChrome({
				chromeRight: 220,
				rowLeft: 12,
				rowWidth: 800,
				bannerWidth: 450
			})
		).toBe(true);
	});

	it('treats a near miss as overlap so the pills do not kiss', () => {
		const rowLeft = 0;
		const rowWidth = 800;
		const bannerWidth = 400;
		const centeredLeft = rowLeft + rowWidth / 2 - bannerWidth / 2;
		expect(
			centeredBannerOverlapsChrome({
				chromeRight: centeredLeft - 4,
				rowLeft,
				rowWidth,
				bannerWidth,
				gap: 8
			})
		).toBe(true);
		expect(
			centeredBannerOverlapsChrome({
				chromeRight: centeredLeft - 16,
				rowLeft,
				rowWidth,
				bannerWidth,
				gap: 8
			})
		).toBe(false);
	});
});

describe('viewportTooSmallForChrome', () => {
	it('allows the app when the toolbar still fits', () => {
		expect(viewportTooSmallForChrome(279, 320)).toBe(false);
	});

	it('blocks the app when the toolbar would overflow the row', () => {
		expect(viewportTooSmallForChrome(279, 260)).toBe(true);
	});

	it('treats an exact fit as still usable', () => {
		expect(viewportTooSmallForChrome(279, 279)).toBe(false);
	});

	it('clears once the viewport grows past the toolbar', () => {
		const required = 279;
		const padX = 32;
		expect(viewportTooSmallForChrome(required, availableHudWidth(220, padX))).toBe(true);
		expect(viewportTooSmallForChrome(required, availableHudWidth(1280, padX))).toBe(false);
	});
});

describe('availableHudWidth', () => {
	it('subtracts HUD padding from the layout viewport', () => {
		expect(availableHudWidth(800, 32)).toBe(768);
	});

	it('does not go negative on a tiny viewport', () => {
		expect(availableHudWidth(20, 32)).toBe(0);
	});
});

describe('tooSmallMediaMaxWidth', () => {
	it('blocks at the media max-width and clears one pixel wider', () => {
		const required = 279;
		const padX = 32;
		const max = tooSmallMediaMaxWidth(required, padX);
		expect(viewportTooSmallForChrome(required, availableHudWidth(max, padX))).toBe(true);
		expect(viewportTooSmallForChrome(required, availableHudWidth(max + 1, padX))).toBe(false);
	});
});

describe('chromeContentWidth', () => {
	it('adds padding, border, logo, gap, and tools', () => {
		expect(
			chromeContentWidth({
				paddingX: 12.8,
				borderX: 2,
				logo: 32,
				gap: 12,
				tools: 220
			})
		).toBeCloseTo(278.8);
	});
});
