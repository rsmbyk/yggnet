import type { GraphDocument } from '../model/types';

export type AnalysisValue = string | number | boolean | string[] | number[];
export type AnalysisInput = Record<string, AnalysisValue | undefined>;

export type AnalysisField =
	| { kind: 'node'; id: string; label: string; required?: boolean }
	| { kind: 'node-set'; id: string; label: string; required?: boolean }
	| { kind: 'edge'; id: string; label: string; required?: boolean }
	| { kind: 'number'; id: string; label: string; required?: boolean; min?: number; max?: number }
	| { kind: 'boolean'; id: string; label: string; required?: boolean }
	| {
			kind: 'enum';
			id: string;
			label: string;
			required?: boolean;
			options: Array<{ value: string; label: string }>;
	  };

export type AnalysisArtifact =
	| { kind: 'path'; id: string; label: string; nodeIds: string[]; edgeIds: string[] }
	| { kind: 'ordered-nodes'; id: string; label: string; nodeIds: string[] }
	| { kind: 'node-set'; id: string; label: string; nodeIds: string[] }
	| { kind: 'edge-set'; id: string; label: string; edgeIds: string[] }
	| { kind: 'tree'; id: string; label: string; nodeIds: string[]; edgeIds: string[] }
	| {
			kind: 'landmarks';
			id: string;
			label: string;
			entries: Array<{ nodeId: string; role: 'start' | 'end' }>;
	  }
	| {
			kind: 'partition';
			id: string;
			label: string;
			parts: Array<{ label: string; nodeIds: string[] }>;
	  }
	| { kind: 'ranking'; id: string; label: string; entries: Array<{ id: string; value: number }> }
	| { kind: 'per-edge-values'; id: string; label: string; values: Record<string, number> }
	| { kind: 'table'; id: string; label: string; columns: string[]; rows: AnalysisValue[][] };

export interface AnalysisResult {
	outcome: 'complete' | 'no-result';
	summary: string;
	metrics: Array<{ label: string; value: string | number }>;
	artifacts: AnalysisArtifact[];
}

export type AnalysisRole =
	'current' | 'inspecting' | 'frontier' | 'settled' | 'result' | 'rejected' | (string & {});

export interface AnalysisRoleChange {
	entity: 'node' | 'edge';
	id: string;
	role: AnalysisRole;
	operation: 'add' | 'remove';
}

export type InspectorKind = 'scalar' | 'queue' | 'stack' | 'set' | 'ordered-list' | 'map' | 'table';

export type InspectorOperation =
	| { inspector: string; operation: 'reset'; kind: InspectorKind; value?: unknown }
	| { inspector: string; operation: 'set'; key?: string; value: unknown }
	| { inspector: string; operation: 'enqueue' | 'push' | 'add' | 'append'; value: unknown }
	| { inspector: string; operation: 'dequeue' | 'pop' }
	| { inspector: string; operation: 'remove'; value: unknown };

export interface AnalysisEvent {
	sequence: number;
	action: string;
	narration: { key: string; refs: Record<string, string | number | boolean> };
	roles: AnalysisRoleChange[];
	inspectors: InspectorOperation[];
	phase?: string;
	progress?: number;
}

export interface AnalysisOutput {
	result: AnalysisResult;
	events: AnalysisEvent[];
}

export interface AnalysisValidation {
	valid: boolean;
	fieldErrors: Record<string, string>;
	formError?: string;
}

export interface AnalysisDefinition {
	id: string;
	name: string;
	category: string;
	description: string;
	fields: AnalysisField[];
	validate?: (snapshot: GraphDocument, input: AnalysisInput) => string | undefined;
	execute: (snapshot: GraphDocument, input: AnalysisInput) => AnalysisOutput;
}

export function validateAnalysisInput(
	definition: AnalysisDefinition,
	snapshot: GraphDocument,
	input: AnalysisInput
): AnalysisValidation {
	const fieldErrors: Record<string, string> = {};
	for (const field of definition.fields) {
		const value = input[field.id];
		if (
			field.required &&
			(value === undefined || value === '' || (Array.isArray(value) && !value.length))
		) {
			fieldErrors[field.id] = field.kind === 'node' ? 'Choose a node.' : 'This field is required.';
			continue;
		}
		if (value === undefined) continue;
		if (field.kind === 'node' && (typeof value !== 'string' || !snapshot.nodes[value])) {
			fieldErrors[field.id] = 'Choose a node in the graph.';
		} else if (field.kind === 'edge' && (typeof value !== 'string' || !snapshot.edges[value])) {
			fieldErrors[field.id] = 'Choose an edge in the graph.';
		} else if (field.kind === 'number' && typeof value === 'number') {
			if (field.min !== undefined && value < field.min)
				fieldErrors[field.id] = `Must be at least ${field.min}.`;
			if (field.max !== undefined && value > field.max)
				fieldErrors[field.id] = `Must be at most ${field.max}.`;
		} else if (field.kind === 'enum' && !field.options.some((option) => option.value === value)) {
			fieldErrors[field.id] = 'Choose a valid option.';
		}
	}
	const formError = Object.keys(fieldErrors).length
		? undefined
		: definition.validate?.(snapshot, input);
	return {
		valid: Object.keys(fieldErrors).length === 0 && !formError,
		fieldErrors,
		...(formError ? { formError } : {})
	};
}
