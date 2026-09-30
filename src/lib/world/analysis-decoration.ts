import type { AnalysisArtifact, AnalysisRole } from '$lib/graph';

export interface AnalysisResultEntity {
	kind: 'node' | 'edge';
	id: string;
}

export type AnalysisLandmarkRole = 'start' | 'end';

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
		if (artifact.kind === 'landmarks')
			artifact.entries.forEach((entry) => add('node', entry.nodeId));
	}
	return entities;
}

export function analysisResultLandmarks(
	artifacts: AnalysisArtifact[]
): Record<string, AnalysisLandmarkRole[]> {
	const landmarks: Record<string, AnalysisLandmarkRole[]> = {};
	for (const artifact of artifacts) {
		if (artifact.kind !== 'landmarks') continue;
		for (const entry of artifact.entries) {
			const roles = landmarks[entry.nodeId] ?? [];
			if (!roles.includes(entry.role)) roles.push(entry.role);
			landmarks[entry.nodeId] = roles;
		}
	}
	return landmarks;
}

export function landmarkGlyph(roles: AnalysisLandmarkRole[]): 'start' | 'end' | 'combined' | null {
	const start = roles.includes('start');
	const end = roles.includes('end');
	if (start && end) return 'combined';
	if (start) return 'start';
	return end ? 'end' : null;
}

export function revealDuration(entityCount: number): number {
	return Math.min(2600, Math.max(700, 700 + Math.max(0, entityCount - 1) * 28));
}

export function revealProgress(
	elapsedMs: number,
	entityCount: number,
	reducedMotion: boolean
): number {
	if (reducedMotion) return 1;
	return Math.min(1, Math.max(0, elapsedMs / revealDuration(entityCount)));
}
