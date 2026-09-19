export const TOOL_IDS = [
	'mode',
	'file',
	'templates',
	'nodes',
	'edges',
	'filters',
	'groups',
	'pathfinder',
	'analyze',
	'diff'
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export const TOOLS: { id: ToolId; label: string }[] = [
	{ id: 'mode', label: 'Mode' },
	{ id: 'file', label: 'File' },
	{ id: 'templates', label: 'Templates' },
	{ id: 'nodes', label: 'Nodes' },
	{ id: 'edges', label: 'Edges' },
	{ id: 'filters', label: 'Filters' },
	{ id: 'groups', label: 'Groups' },
	{ id: 'pathfinder', label: 'Pathfinder' },
	{ id: 'analyze', label: 'Analyze' },
	{ id: 'diff', label: 'Diff' }
];

export function toolLabel(id: ToolId): string {
	return TOOLS.find((t) => t.id === id)?.label ?? id;
}

/** Clicking the open tool closes it; clicking another switches. */
export function nextOpenTool(current: ToolId | null, clicked: ToolId): ToolId | null {
	return current === clicked ? null : clicked;
}
