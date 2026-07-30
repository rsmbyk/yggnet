import type { AlgorithmResult, TraceEvent } from '../algorithms/types';

export interface RunRecord {
	id: string;
	algorithmId: string;
	params: Record<string, unknown>;
	result: AlgorithmResult;
	trace: TraceEvent[];
	stale: boolean;
	createdAt: string;
	annotations?: Record<number, string>;
}

export interface RunStore {
	runs: Record<string, RunRecord>;
}

export function createRunStore(): RunStore {
	return { runs: {} };
}

export function addRun(
	store: RunStore,
	input: Omit<RunRecord, 'id' | 'stale' | 'createdAt' | 'annotations'> & {
		id?: string;
		annotations?: Record<number, string>;
	}
): { store: RunStore; run: RunRecord } {
	const run: RunRecord = {
		id: input.id ?? crypto.randomUUID(),
		algorithmId: input.algorithmId,
		params: input.params,
		result: input.result,
		trace: input.trace,
		stale: false,
		createdAt: new Date().toISOString(),
		...(input.annotations ? { annotations: { ...input.annotations } } : {})
	};
	return {
		store: { runs: { ...store.runs, [run.id]: run } },
		run
	};
}

export function markAllStale(store: RunStore): RunStore {
	const runs: Record<string, RunRecord> = {};
	for (const [id, run] of Object.entries(store.runs)) {
		runs[id] = { ...run, stale: true };
	}
	return { runs };
}

export function getRun(store: RunStore, id: string): RunRecord | undefined {
	return store.runs[id];
}

export function annotateStep(
	store: RunStore,
	runId: string,
	stepIndex: number,
	note: string
): RunStore {
	const run = store.runs[runId];
	if (!run) {
		throw new Error(`Run not found: ${runId}`);
	}
	const annotations = { ...(run.annotations ?? {}), [stepIndex]: note };
	return {
		runs: {
			...store.runs,
			[runId]: { ...run, annotations }
		}
	};
}
