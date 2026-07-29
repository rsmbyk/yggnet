/** Core domain types. Framework-agnostic. */

export type NodeId = string;
export type EdgeId = string;

export interface GraphNode {
	id: NodeId;
	label: string;
	position: { x: number; y: number; z: number };
	pinned: boolean;
	groupId?: string;
	tags: string[];
	weight?: number;
	notes?: string;
	/** Attachment refs (URLs / local keys) — payload shape evolves in later specs. */
	attachments: string[];
	data: Record<string, unknown>;
}

export interface GraphEdge {
	id: EdgeId;
	from: NodeId;
	to: NodeId;
	directed: boolean;
	label?: string;
	weight: number;
	notes?: string;
	attachments: string[];
	data: Record<string, unknown>;
}

export interface GraphDocument {
	schemaVersion: 1;
	id: string;
	title: string;
	nodes: Record<NodeId, GraphNode>;
	edges: Record<EdgeId, GraphEdge>;
	createdAt: string;
	updatedAt: string;
}

export type AppMode = 'explore' | 'directions' | 'analyze';
