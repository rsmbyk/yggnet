/** Inputs for the tools-panel height cap above the minimap. */
export type ToolsPanelLimitInput = {
	panelTop: number;
	dockBottom: number;
	minimapTop: number | null;
	edge: number;
	expanded: boolean;
};

/**
 * Max height for a content-fitting tools panel.
 * Collapsed: stop above the minimap (plus edge). Expanded: dock bottom.
 */
export function toolsPanelMaxHeight(input: ToolsPanelLimitInput): number {
	const expandedMax = Math.max(0, input.dockBottom - input.panelTop);
	if (input.expanded || input.minimapTop == null) return expandedMax;
	const collapsedMax = input.minimapTop - input.edge - input.panelTop;
	return Math.max(0, Math.min(expandedMax, collapsedMax));
}

/** True when content does not fit in the current max height. */
export function toolsPanelOverflows(contentHeight: number, maxHeight: number, slop = 1): boolean {
	return contentHeight > maxHeight + slop;
}

/** Resolve a CSS length like `0.75rem` or `12px` to device pixels. */
export function cssLengthToPx(value: string, rootFontSizePx: number): number {
	const trimmed = value.trim();
	const n = Number.parseFloat(trimmed);
	if (!Number.isFinite(n)) return 0;
	if (trimmed.endsWith('rem')) return n * rootFontSizePx;
	return n;
}
