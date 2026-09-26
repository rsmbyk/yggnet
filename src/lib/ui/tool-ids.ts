export const TOOL_IDS = [
	'file',
	'generate',
	'nodes',
	'edges',
	'tags',
	'pathfinder',
	'analyze',
	'diff'
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

export const TOOLS: { id: ToolId; label: string }[] = [
	{ id: 'file', label: 'File' },
	{ id: 'generate', label: 'Generate' },
	{ id: 'nodes', label: 'Nodes' },
	{ id: 'edges', label: 'Edges' },
	{ id: 'tags', label: 'Tags' },
	{ id: 'pathfinder', label: 'Pathfinder' },
	{ id: 'analyze', label: 'Analyze' },
	{ id: 'diff', label: 'Diff' }
];

export type PanelSection = ToolId | 'selection' | 'tag-edit';

export function toolLabel(id: ToolId): string {
	return TOOLS.find((t) => t.id === id)?.label ?? id;
}

/** Clicking the open tool closes it; clicking another switches. */
export function nextOpenTool(current: ToolId | null, clicked: ToolId): ToolId | null {
	return current === clicked ? null : clicked;
}

/** Freestanding selection card — no toolbar icon; hidden while any tool is open. */
export function selectionPanelOpen(
	openTool: ToolId | null,
	nodeCount: number,
	edgeCount: number
): boolean {
	return openTool === null && (nodeCount > 0 || edgeCount > 0);
}

/** Node details companion — sits to the right of the Nodes tool when one node is selected. */
export function nodesCompanionOpen(openTool: ToolId | null, nodeCount: number): boolean {
	return openTool === 'nodes' && nodeCount === 1;
}

/** Edge details companion — sits to the right of the Edges tool when one edge is selected. */
export function edgesCompanionOpen(openTool: ToolId | null, edgeCount: number): boolean {
	return openTool === 'edges' && edgeCount === 1;
}

/** Tag rename companion — sits to the right of the Tags tool when a row is open for edit. */
export function tagsCompanionOpen(openTool: ToolId | null, editingTag: string | null): boolean {
	return openTool === 'tags' && editingTag !== null;
}
