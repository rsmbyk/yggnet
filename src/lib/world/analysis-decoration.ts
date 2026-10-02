import type { AnalysisArtifact, AnalysisRevealTimeline, AnalysisRole } from '$lib/graph';

export interface AnalysisResultEntity {
	kind: 'node' | 'edge';
	id: string;
}

export interface AnalysisRevealFrame {
	nodeIds: Set<string>;
	edgeIds: Set<string>;
	nodeRoles: Map<string, string>;
	edgeRoles: Map<string, string>;
	revisitedNodeIds: Set<string>;
	activeNodeIds: Set<string>;
	activeEdgeIds: Map<string, number>;
	emphasizedNodeIds: Set<string>;
	emphasizedEdgeIds: Set<string>;
	activeEmphasizedEdgeIds: Map<string, number>;
	emphasizedArtifactIds: Set<string>;
}

function revealSteps(timeline: AnalysisRevealTimeline) {
	return timeline.phases.flatMap((phase) => phase.steps);
}

export function analysisRevealStepCount(timeline: AnalysisRevealTimeline): number {
	return revealSteps(timeline).length;
}

export function analysisRevealFrame(
	timeline: AnalysisRevealTimeline,
	progress: number
): AnalysisRevealFrame {
	const steps = revealSteps(timeline);
	const bounded = Math.min(1, Math.max(0, progress));
	const scaled = bounded * steps.length;
	const visibleCount = bounded === 0 ? 0 : Math.min(steps.length, Math.ceil(scaled));
	const localProgress = scaled - Math.floor(scaled);
	const activeIndex = localProgress > 0 ? Math.min(steps.length - 1, Math.floor(scaled)) : -1;
	const frame: AnalysisRevealFrame = {
		nodeIds: new Set(),
		edgeIds: new Set(),
		nodeRoles: new Map(),
		edgeRoles: new Map(),
		revisitedNodeIds: new Set(),
		activeNodeIds: new Set(),
		activeEdgeIds: new Map(),
		emphasizedNodeIds: new Set(),
		emphasizedEdgeIds: new Set(),
		activeEmphasizedEdgeIds: new Map(),
		emphasizedArtifactIds: new Set()
	};
	steps.slice(0, visibleCount).forEach((step, stepIndex) => {
		for (const action of step.actions) {
			if (action.kind === 'reset-footprint') {
				frame.nodeIds.clear();
				frame.edgeIds.clear();
				frame.nodeRoles.clear();
				frame.edgeRoles.clear();
				frame.emphasizedNodeIds.clear();
				frame.emphasizedEdgeIds.clear();
				frame.emphasizedArtifactIds.clear();
			} else if (action.kind === 'reveal-node') {
				frame.nodeIds.add(action.nodeId);
				frame.nodeRoles.set(action.nodeId, action.role ?? 'settled');
				if (stepIndex === activeIndex) frame.activeNodeIds.add(action.nodeId);
			} else if (action.kind === 'reveal-edge') {
				frame.edgeIds.add(action.edgeId);
				frame.edgeRoles.set(action.edgeId, action.role ?? 'settled');
				if (stepIndex === activeIndex) frame.activeEdgeIds.set(action.edgeId, localProgress);
			} else if (action.kind === 'revisit-node') {
				frame.nodeIds.add(action.nodeId);
				if (stepIndex === activeIndex) frame.activeNodeIds.add(action.nodeId);
				if (stepIndex === activeIndex && bounded < 1) frame.revisitedNodeIds.add(action.nodeId);
				if (action.viaEdgeId) {
					frame.edgeIds.add(action.viaEdgeId);
					if (stepIndex === activeIndex) frame.activeEdgeIds.set(action.viaEdgeId, localProgress);
				}
			} else if (action.kind === 'emphasize-node') {
				frame.nodeIds.add(action.nodeId);
				frame.emphasizedNodeIds.add(action.nodeId);
				if (stepIndex === activeIndex) frame.activeNodeIds.add(action.nodeId);
			} else if (action.kind === 'emphasize-edge') {
				frame.emphasizedEdgeIds.add(action.edgeId);
				if (stepIndex === activeIndex)
					frame.activeEmphasizedEdgeIds.set(action.edgeId, localProgress);
			} else {
				frame.emphasizedArtifactIds.add(action.artifactId);
			}
		}
	});
	return frame;
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

export function analysisLandmarkScale(
	landmark: Exclude<ReturnType<typeof landmarkGlyph>, null>
): number {
	return landmark === 'combined' ? 2.05 : 1.9;
}

export function analysisRoleColor(role: AnalysisRole | null): string {
	if (role?.startsWith('color-')) {
		const colors = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
		return colors[Number(role.slice('color-'.length)) % colors.length];
	}
	if (role?.startsWith('component-')) {
		const colors = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#fb7185', '#22d3ee'];
		return colors[Number(role.slice('component-'.length)) % colors.length];
	}
	if (role === 'critical') return '#f43f5e';
	if (role === 'result') return '#4ade80';
	if (role === 'frontier') return '#a78bfa';
	if (role === 'inspecting') return '#fbbf24';
	if (role === 'active' || role === 'revisited') return '#f0a65a';
	if (role === 'start-side' || role === 'source' || role === 'current') return '#67e8f9';
	if (role === 'target-side') return '#f472b6';
	if (role === 'settled') return '#f0a65a';
	return '#ef6b73';
}

export function analysisResultEdgeEndpoints(edge: { from: string; to: string }): {
	from: string;
	to: string;
} {
	return { from: edge.from, to: edge.to };
}

export function analysisResultNodeRole(frame: AnalysisRevealFrame, nodeId: string): AnalysisRole {
	if (frame.revisitedNodeIds.has(nodeId)) return 'revisited';
	if (frame.emphasizedNodeIds.has(nodeId)) return 'result';
	if (frame.activeNodeIds.has(nodeId)) return 'active';
	const role = frame.nodeRoles.get(nodeId);
	return role === 'critical' || role?.startsWith('component-') || role?.startsWith('color-')
		? role
		: 'settled';
}

export function analysisResultNodeMarker(
	frame: AnalysisRevealFrame,
	nodeId: string
): 'start-side' | 'target-side' | null {
	if (!frame.activeNodeIds.has(nodeId)) return null;
	const role = frame.nodeRoles.get(nodeId);
	if (role === 'start-side' || role === 'source') return 'start-side';
	return role === 'target-side' ? 'target-side' : null;
}

export function analysisResultEdgeRole(frame: AnalysisRevealFrame, edgeId: string): AnalysisRole {
	if (frame.activeEdgeIds.has(edgeId)) return 'active';
	return frame.edgeRoles.get(edgeId) === 'critical' ? 'critical' : 'settled';
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
		if (artifact.kind === 'ranking') artifact.entries.forEach((entry) => add('node', entry.id));
	}
	return entities;
}

export function analysisRankingScale(artifacts: AnalysisArtifact[], nodeId: string): number {
	const ranking = artifacts.find(
		(artifact): artifact is Extract<AnalysisArtifact, { kind: 'ranking' }> =>
			artifact.kind === 'ranking'
	);
	const value = ranking?.entries.find((entry) => entry.id === nodeId)?.value;
	return value === undefined ? 1 : 1 + Math.max(0, Math.min(1, value)) * 0.9;
}

export function analysisRankingColor(artifacts: AnalysisArtifact[], nodeId: string): string | null {
	const ranking = artifacts.find(
		(artifact): artifact is Extract<AnalysisArtifact, { kind: 'ranking' }> =>
			artifact.kind === 'ranking'
	);
	const value = ranking?.entries.find((entry) => entry.id === nodeId)?.value;
	if (value === undefined) return null;
	const t = Math.max(0, Math.min(1, value));
	const start = t <= 0.5 ? ([127, 29, 29] as const) : ([250, 204, 21] as const);
	const target = t <= 0.5 ? ([250, 204, 21] as const) : ([74, 222, 128] as const);
	const amount = t <= 0.5 ? t * 2 : (t - 0.5) * 2;
	const channel = (start: number, end: number) =>
		Math.round(start + (end - start) * amount)
			.toString(16)
			.padStart(2, '0');
	return `#${channel(start[0], target[0])}${channel(start[1], target[1])}${channel(start[2], target[2])}`;
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

export const RESULT_REVEAL_STEP_MS = 50;
export const RESULT_REVEAL_PHASE_HOLD_MS = 200;

export function analysisRevealDuration(timeline: AnalysisRevealTimeline): number {
	const stepCount = analysisRevealStepCount(timeline);
	if (stepCount === 0) return 0;
	return (
		stepCount * RESULT_REVEAL_STEP_MS +
		Math.max(0, timeline.phases.length - 1) * RESULT_REVEAL_PHASE_HOLD_MS
	);
}

export function analysisRevealProgress(
	timeline: AnalysisRevealTimeline,
	elapsedMs: number,
	reducedMotion: boolean
): number {
	const stepCount = analysisRevealStepCount(timeline);
	if (reducedMotion || stepCount === 0) return 1;
	const stepDuration = RESULT_REVEAL_STEP_MS;
	let remaining = Math.max(0, elapsedMs);
	let completedSteps = 0;

	for (const [phaseIndex, phase] of timeline.phases.entries()) {
		const phaseDuration = phase.steps.length * stepDuration;
		if (remaining < phaseDuration) {
			return Math.min(1, (completedSteps + remaining / stepDuration) / stepCount);
		}
		remaining -= phaseDuration;
		completedSteps += phase.steps.length;
		if (phaseIndex < timeline.phases.length - 1) {
			if (remaining < RESULT_REVEAL_PHASE_HOLD_MS) return completedSteps / stepCount;
			remaining -= RESULT_REVEAL_PHASE_HOLD_MS;
		}
	}
	return 1;
}
