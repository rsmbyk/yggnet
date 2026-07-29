import type { GraphDocument } from '../model/types';

/** JSON-safe algorithm events for step replay (cached on runs). */
export type TraceEvent =
	| { type: 'start'; algorithmId: string }
	| { type: 'visit'; nodeId: string; meta?: Record<string, unknown> }
	| { type: 'relax'; edgeId: string; from: string; to: string; meta?: Record<string, unknown> }
	| { type: 'done'; result: AlgorithmResult };

export type AlgorithmResult =
	| { kind: 'path'; nodeIds: string[]; edgeIds: string[] }
	| { kind: 'empty' }
	| { kind: 'custom'; data: Record<string, unknown> };

export interface AlgorithmInput {
	documentSnapshot: GraphDocument;
	algorithmId: string;
	params: Record<string, unknown>;
}

export interface AlgorithmOutput {
	result: AlgorithmResult;
	trace: TraceEvent[];
}

/**
 * Runner abstraction — MainThreadRunner now; WorkerRunner later.
 * Implementations must accept/return structured-clone-safe data.
 */
export interface AlgorithmRunner {
	run(input: AlgorithmInput): Promise<AlgorithmOutput>;
}
