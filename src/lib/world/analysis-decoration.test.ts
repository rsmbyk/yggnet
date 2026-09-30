import { describe, expect, it } from 'vitest';
import {
	analysisRevealFrame,
	analysisRevealDuration,
	analysisRevealProgress,
	analysisRevealStepCount,
	analysisLandmarkScale,
	analysisResultEdgeEndpoints,
	analysisResultEdgeRole,
	analysisResultNodeMarker,
	analysisResultNodeRole,
	analysisRoleColor,
	analysisResultSequence,
	analysisResultLandmarks,
	analysisGlyphScale,
	landmarkGlyph,
	primaryAnalysisRole,
	revealDuration,
	revealProgress
} from './analysis-decoration';
import type { AnalysisRevealTimeline } from '$lib/graph';

describe('analysis decoration policy', () => {
	it('uses deterministic role priority', () => {
		expect(primaryAnalysisRole(['rejected', 'settled', 'frontier'])).toBe('frontier');
		expect(primaryAnalysisRole(['current', 'result', 'inspecting'])).toBe('result');
	});

	it('keeps glyph scale stable at every camera distance', () => {
		expect(analysisGlyphScale(1)).toBe(1);
		expect(analysisGlyphScale(1000)).toBe(1);
		expect(analysisGlyphScale(20)).toBe(1);
	});

	it('keeps traversal orange and uses green only for the returned path', () => {
		const timeline: AnalysisRevealTimeline = {
			phases: [
				{
					id: 'search',
					steps: [
						{ actions: [{ kind: 'reveal-node', nodeId: 'A', role: 'start-side' }] },
						{
							actions: [
								{ kind: 'reveal-edge', edgeId: 'e0', role: 'frontier' },
								{ kind: 'reveal-node', nodeId: 'B', role: 'frontier' }
							]
						},
						{ actions: [{ kind: 'emphasize-node', nodeId: 'A' }] },
						{
							actions: [
								{ kind: 'emphasize-edge', edgeId: 'e0' },
								{ kind: 'emphasize-node', nodeId: 'B' }
							]
						}
					]
				}
			]
		};
		const exploring = analysisRevealFrame(timeline, 0.4);
		const replaying = analysisRevealFrame(timeline, 0.9);
		const edgeRoles = [...exploring.edgeIds].map((id) => analysisResultEdgeRole(exploring, id));

		expect(analysisResultNodeRole(exploring, 'A')).toBe('settled');
		expect(analysisResultNodeMarker(exploring, 'A')).toBe('start-side');
		expect(analysisResultNodeRole(exploring, 'B')).toBe('active');
		expect(edgeRoles).toEqual(['active']);
		expect(edgeRoles).not.toEqual(
			expect.arrayContaining(['frontier', 'start-side', 'target-side'])
		);
		expect(analysisRoleColor('active')).toBe('#f0a65a');
		expect(analysisRoleColor('settled')).toBe('#f0a65a');
		expect(analysisResultEdgeRole(replaying, 'e0')).toBe('settled');
		expect(analysisRoleColor('result')).toBe('#4ade80');
		expect([...replaying.edgeIds].every((id) => ['e0'].includes(id))).toBe(true);
	});

	it('makes endpoint landmarks larger than ordinary analysis rings', () => {
		expect(analysisLandmarkScale('start')).toBeGreaterThanOrEqual(1.8);
		expect(analysisLandmarkScale('end')).toBeGreaterThanOrEqual(1.8);
		expect(analysisLandmarkScale('combined')).toBeGreaterThanOrEqual(1.8);
		expect(analysisGlyphScale(20)).toBe(1);
	});

	it('uses a revealed edge stored endpoints instead of traversal-order neighbors', () => {
		expect(analysisResultEdgeEndpoints({ from: 'A', to: 'C' })).toEqual({
			from: 'A',
			to: 'C'
		});
	});

	it('bounds result reveal and supports immediate reduced motion', () => {
		expect(revealDuration(1)).toBe(700);
		expect(revealDuration(10_000)).toBe(2600);
		expect(revealProgress(revealDuration(10) / 2, 10, false)).toBeCloseTo(0.5);
		expect(revealProgress(0, 10, true)).toBe(1);
	});

	it('uses 180 ms per step and holds for 300 ms only between reveal phases', () => {
		const timeline: AnalysisRevealTimeline = {
			phases: ['depth-0', 'depth-1', 'depth-2'].map((id, index) => ({
				id,
				steps: [{ actions: [{ kind: 'reveal-node', nodeId: String(index) }] }]
			}))
		};
		const singlePhase: AnalysisRevealTimeline = { phases: [timeline.phases[0]] };

		expect(analysisRevealDuration(singlePhase)).toBe(180);
		expect(analysisRevealDuration(timeline)).toBe(1140);
		expect(analysisRevealProgress(timeline, 180 + 150, false)).toBeCloseTo(1 / 3);
		expect(analysisRevealProgress(timeline, 0, true)).toBe(1);
	});

	it('merges result landmarks without stacking badges', () => {
		const landmarks = analysisResultLandmarks([
			{
				kind: 'landmarks',
				id: 'terminals',
				label: 'Important nodes',
				entries: [
					{ nodeId: 'A', role: 'start' },
					{ nodeId: 'B', role: 'end' }
				]
			}
		]);
		expect(landmarks).toEqual({ A: ['start'], B: ['end'] });
		expect(landmarkGlyph(['start'])).toBe('start');
		expect(landmarkGlyph(['end'])).toBe('end');
		expect(landmarkGlyph(['start', 'end'])).toBe('combined');
		expect(landmarkGlyph([])).toBeNull();
	});

	it('interleaves BFS tree edges with the nodes they discover', () => {
		expect(
			analysisResultSequence([
				{
					kind: 'ordered-nodes',
					id: 'traversal',
					label: 'Traversal order',
					nodeIds: ['A', 'B', 'C', 'D', 'E']
				},
				{
					kind: 'tree',
					id: 'tree',
					label: 'BFS tree',
					nodeIds: ['A', 'B', 'C', 'D', 'E'],
					edgeIds: ['A-B', 'A-C', 'A-D', 'B-E']
				}
			])
		).toEqual([
			{ kind: 'node', id: 'A' },
			{ kind: 'edge', id: 'A-B' },
			{ kind: 'node', id: 'B' },
			{ kind: 'edge', id: 'A-C' },
			{ kind: 'node', id: 'C' },
			{ kind: 'edge', id: 'A-D' },
			{ kind: 'node', id: 'D' },
			{ kind: 'edge', id: 'B-E' },
			{ kind: 'node', id: 'E' }
		]);
	});

	it('reduces generic reveal phases with concurrent steps and resets', () => {
		const timeline: AnalysisRevealTimeline = {
			phases: [
				{
					id: 'depth-0',
					steps: [
						{ actions: [{ kind: 'reveal-node', nodeId: 'A' }] },
						{ actions: [{ kind: 'reveal-node', nodeId: 'B' }] }
					]
				},
				{
					id: 'depth-1',
					steps: [
						{ actions: [{ kind: 'reset-footprint' }] },
						{
							actions: [
								{ kind: 'reveal-node', nodeId: 'A' },
								{ kind: 'reveal-node', nodeId: 'C' }
							]
						},
						{ actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }] }
					]
				}
			]
		};

		expect(analysisRevealStepCount(timeline)).toBe(5);
		expect([...analysisRevealFrame(timeline, 0.4).nodeIds]).toEqual(['A', 'B']);
		expect([...analysisRevealFrame(timeline, 0.6).nodeIds]).toEqual([]);
		expect([...analysisRevealFrame(timeline, 0.8).nodeIds]).toEqual(['A', 'C']);
		expect([...analysisRevealFrame(timeline, 1).emphasizedArtifactIds]).toEqual(['path']);
	});

	it('exposes only the active revisit pulse while retaining its footprint', () => {
		const timeline: AnalysisRevealTimeline = {
			phases: [
				{
					id: 'walk',
					steps: [
						{ actions: [{ kind: 'reveal-node', nodeId: 'A' }] },
						{
							actions: [
								{ kind: 'reveal-edge', edgeId: 'e0' },
								{ kind: 'revisit-node', nodeId: 'A', viaEdgeId: 'e0' }
							]
						}
					]
				}
			]
		};
		const frame = analysisRevealFrame(timeline, 0.75);
		expect([...frame.nodeIds]).toEqual(['A']);
		expect([...frame.edgeIds]).toEqual(['e0']);
		expect([...frame.revisitedNodeIds]).toEqual(['A']);
		expect(frame.activeEdgeIds.get('e0')).toBeCloseTo(0.5);
	});

	it('accumulates an ordered path emphasis while keeping the explored footprint', () => {
		const timeline: AnalysisRevealTimeline = {
			phases: [
				{
					id: 'search',
					steps: [
						{
							actions: [
								{ kind: 'reveal-node', nodeId: 'A' },
								{ kind: 'reveal-edge', edgeId: 'e0' },
								{ kind: 'reveal-node', nodeId: 'B' }
							]
						},
						{ actions: [{ kind: 'emphasize-node', nodeId: 'A' }] },
						{
							actions: [
								{ kind: 'emphasize-edge', edgeId: 'e0' },
								{ kind: 'emphasize-node', nodeId: 'B' }
							]
						}
					]
				}
			]
		};
		const active = analysisRevealFrame(timeline, 0.75);
		const complete = analysisRevealFrame(timeline, 1);

		expect([...active.activeNodeIds]).toEqual(['B']);
		expect(active.activeEmphasizedEdgeIds.get('e0')).toBeCloseTo(0.25);
		expect([...complete.nodeIds]).toEqual(['A', 'B']);
		expect([...complete.edgeIds]).toEqual(['e0']);
		expect([...complete.emphasizedNodeIds]).toEqual(['A', 'B']);
		expect([...complete.emphasizedEdgeIds]).toEqual(['e0']);
	});
});
