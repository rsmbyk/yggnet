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
 */
export function viewportTooSmallForChrome(
	requiredChromeWidth: number,
	availableWidth: number,
	epsilon = 1
): boolean {
	return requiredChromeWidth > availableWidth + epsilon;
}

/** Layout viewport minus HUD left/right padding — the toolbar's horizontal budget. */
export function availableHudWidth(viewportWidth: number, paddingX: number): number {
	return Math.max(0, viewportWidth - paddingX);
}

/**
 * `@media (max-width)` breakpoint that matches {@link viewportTooSmallForChrome}
 * for the same required toolbar width and HUD padding.
 */
export function tooSmallMediaMaxWidth(
	requiredChromeWidth: number,
	paddingX: number,
	epsilon = 1
): number {
	return Math.max(0, Math.ceil(requiredChromeWidth + paddingX - epsilon) - 1);
}

/** Full toolbar width: chrome padding/border + logo + gap + tools row. */
export function chromeContentWidth(parts: {
	paddingX: number;
	borderX: number;
	logo: number;
	gap: number;
	tools: number;
}): number {
	return parts.paddingX + parts.borderX + parts.logo + parts.gap + parts.tools;
}
