import {
	buildAnalysisTrace,
	type AnalysisInput,
	type AnalysisOutput,
	type AnalysisTrace
} from '$lib/graph';

export type AnalysisPanelMode = 'closed' | 'result' | 'trace';
export const ANALYSIS_PLAYBACK_INTERVAL_MS = 300;

export interface CurrentAnalysis {
	algorithmId: string;
	input: AnalysisInput;
	result: AnalysisOutput['result'];
	trace: AnalysisTrace;
	sourceRevision: number;
	panel: AnalysisPanelMode;
	cursor: number;
	playing: boolean;
	reveal: 'playing' | 'complete';
}

export function createCurrentAnalysis(
	algorithmId: string,
	input: AnalysisInput,
	output: AnalysisOutput,
	sourceRevision: number
): CurrentAnalysis {
	return {
		algorithmId,
		input: structuredClone(input),
		result: structuredClone(output.result),
		trace: buildAnalysisTrace(output.events),
		sourceRevision,
		panel: 'result',
		cursor: 0,
		playing: false,
		reveal: 'playing'
	};
}

export function closeAnalysis(current: CurrentAnalysis | null): CurrentAnalysis | null {
	return current ? { ...current, panel: 'closed', playing: false, reveal: 'complete' } : null;
}

export function openAnalysisResult(current: CurrentAnalysis | null): CurrentAnalysis | null {
	return current ? { ...current, panel: 'result', playing: false, reveal: 'complete' } : null;
}

export function openAnalysisTrace(current: CurrentAnalysis | null): CurrentAnalysis | null {
	return current ? { ...current, panel: 'trace', playing: false, reveal: 'complete' } : null;
}

export function seekAnalysis(
	current: CurrentAnalysis | null,
	cursor: number
): CurrentAnalysis | null {
	if (!current) return null;
	return {
		...current,
		cursor: Math.max(0, Math.min(Math.round(cursor), Math.max(0, current.trace.events.length - 1)))
	};
}

export function stepAnalysis(
	current: CurrentAnalysis | null,
	delta: -1 | 1
): CurrentAnalysis | null {
	const sought = current ? seekAnalysis(current, current.cursor + delta) : null;
	return sought ? { ...sought, playing: false } : null;
}

export function resetAnalysis(current: CurrentAnalysis | null): CurrentAnalysis | null {
	return current ? { ...current, cursor: 0, playing: false } : null;
}

export function invalidateAnalysis(_current: CurrentAnalysis | null): null {
	return null;
}
