import { describe, expect, it } from 'vitest';
import { centeredBannerOverlapsChrome } from './hud-layout';

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
