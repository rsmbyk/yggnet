import type { AlgorithmInput, AlgorithmOutput, AlgorithmRunner } from './types';
import { getAlgorithm } from './registry';

/**
 * In-process runner. Swap for a Worker-backed runner without changing call sites.
 * Looks up algorithms from the registry; unknown ids return empty with a minimal trace.
 */
export class MainThreadRunner implements AlgorithmRunner {
	async run(input: AlgorithmInput): Promise<AlgorithmOutput> {
		const algo = getAlgorithm(input.algorithmId);
		if (!algo) {
			const result = { kind: 'empty' as const };
			return {
				result,
				trace: [
					{ type: 'start', algorithmId: input.algorithmId },
					{ type: 'done', result }
				]
			};
		}
		const from = String(input.params.from ?? '');
		const to = String(input.params.to ?? '');
		return algo.run(input.documentSnapshot, { from, to });
	}
}
