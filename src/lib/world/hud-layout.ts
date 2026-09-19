/**
 * True when a horizontally centered connect banner would collide with left chrome
 * on the same row. Used to drop the banner under the toolbar.
 */
export function centeredBannerOverlapsChrome(opts: {
	chromeRight: number;
	rowLeft: number;
	rowWidth: number;
	bannerWidth: number;
	gap?: number;
}): boolean {
	const gap = opts.gap ?? 8;
	const centeredLeft = opts.rowLeft + opts.rowWidth / 2 - opts.bannerWidth / 2;
	return opts.chromeRight + gap > centeredLeft;
}

/**
 * True when the toolbar's full icon row is wider than the space it has.
 * Required width must be measured while the tools are still visible.
 */
export function viewportTooSmallForChrome(
	requiredChromeWidth: number,
	availableWidth: number,
	epsilon = 1
): boolean {
	return requiredChromeWidth > availableWidth + epsilon;
}
