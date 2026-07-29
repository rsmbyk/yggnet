import type { AlgorithmInput, AlgorithmOutput, AlgorithmRunner } from './types';

/**
 * In-process runner. Swap for a Worker-backed runner without changing call sites.
 * Placeholder: unknown algorithms return empty with a minimal trace.
 */
export class MainThreadRunner implements AlgorithmRunner {
	async run(input: AlgorithmInput): Promise<AlgorithmOutput> {
		const trace = [
			{ type: 'start' as const, algorithmId: input.algorithmId },
			{ type: 'done' as const, result: { kind: 'empty' as const } }
		];
		return {
			result: { kind: 'empty' },
			trace
		};
	}
}
