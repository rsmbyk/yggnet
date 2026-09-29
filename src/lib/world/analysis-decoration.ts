import type { AnalysisArtifact, AnalysisRole } from '$lib/graph';

export interface AnalysisResultEntity {
	kind: 'node' | 'edge';
	id: string;
}

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

export function analysisResultSequence(artifacts: AnalysisArtifact[]): AnalysisResultEntity[] {
	const entities: AnalysisResultEntity[] = [];
	const seen = new Set<string>();
	const add = (kind: AnalysisResultEntity['kind'], id: string | undefined) => {
		if (!id) return;
		const key = `${kind}:${id}`;
		if (seen.has(key)) return;
		seen.add(key);
		entities.push({ kind, id });
	};
	const structured = artifacts.find(
		(artifact): artifact is Extract<AnalysisArtifact, { kind: 'path' | 'tree' }> =>
			artifact.kind === 'path' || artifact.kind === 'tree'
	);
	if (structured) {
		add('node', structured.nodeIds[0]);
		structured.edgeIds.forEach((edgeId, index) => {
			add('edge', edgeId);
			add('node', structured.nodeIds[index + 1]);
		});
		structured.nodeIds.slice(structured.edgeIds.length + 1).forEach((id) => add('node', id));
	}
	for (const artifact of artifacts) {
		if ('nodeIds' in artifact) artifact.nodeIds.forEach((id) => add('node', id));
		if ('edgeIds' in artifact) artifact.edgeIds.forEach((id) => add('edge', id));
	}
	return entities;
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
