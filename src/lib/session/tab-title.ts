/** Browser tab title follows the graph name; blank names fall back to the product. */
export function tabTitleFromGraph(title: string): string {
	const trimmed = title.trim();
	return trimmed.length > 0 ? trimmed : 'Yggnet';
}
