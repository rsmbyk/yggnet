import type { AnalysisRole } from '$lib/graph';

const ROLE_PRIORITY: AnalysisRole[] = [
	'result',
	'current',
	'inspecting',
	'frontier',
	'settled',
	'rejected'
];

export function primaryAnalysisRole(roles: AnalysisRole[]): AnalysisRole | null {
	return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? roles[0] ?? null;
}

export function analysisGlyphScale(_cameraDistance: number): number {
	return 1;
}

export function revealDuration(entityCount: number): number {
	return Math.min(3000, Math.max(800, 800 + Math.max(0, entityCount - 1) * 32));
}

export function revealProgress(
	elapsedMs: number,
	entityCount: number,
	reducedMotion: boolean
): number {
	if (reducedMotion) return 1;
	return Math.min(1, Math.max(0, elapsedMs / revealDuration(entityCount)));
}
