import { describe, expect, it } from 'vitest';
import type { GraphDocument } from '../model/types';
import {
	activeAnalysisFields,
	analysisDefinitions,
	normalizeAnalysisInput,
	validateAnalysisInput
} from './index';

function graph(edges: Array<[string, string, boolean?]>): GraphDocument {
	const ids = new Set(edges.flatMap(([from, to]) => [from, to]));
	return {
		schemaVersion: 1,
		id: 'traversal-test',
		title: 'Traversal test',
		createdAt: '2026-09-30T00:00:00.000Z',
		updatedAt: '2026-09-30T00:00:00.000Z',
		groupTagCounter: 0,
		nodes: Object.fromEntries(
			[...ids].map((id) => [
				id,
				{
					id,
					label: id,
					position: { x: 0, y: 0, z: 0 },
					pinned: false,
					tags: [],
					attachments: [],
					data: {}
				}
			])
		),
		edges: Object.fromEntries(
			edges.map(([from, to, directed = false], index) => [
				`e${index}`,
				{
					id: `e${index}`,
					from,
					to,
					directed,
					weight: 1,
					tags: [],
					attachments: [],
					data: {}
				}
			])
		)
	};
}

describe('mode-capable traversal contracts', () => {
	it('defaults BFS to Traverse and excludes the hidden Target value', () => {
		const bfs = analysisDefinitions.get('bfs')!;
		expect(normalizeAnalysisInput(bfs, { start: 'A', target: 'B' })).toEqual({
			mode: 'traverse',
			start: 'A'
		});
		expect(activeAnalysisFields(bfs, { mode: 'traverse' }).map((field) => field.id)).toEqual([
			'mode',
			'start'
		]);
	});

	it('requires Target only in BFS Search mode', () => {
		const bfs = analysisDefinitions.get('bfs')!;
		const doc = graph([['A', 'B']]);
		expect(validateAnalysisInput(bfs, doc, { mode: 'traverse', start: 'A' }).valid).toBe(true);
		expect(validateAnalysisInput(bfs, doc, { mode: 'search', start: 'A' }).fieldErrors).toEqual({
			target: 'Choose a node.'
		});
	});
});

describe('BFS Search', () => {
	it('returns a fewest-edge path and a separate explored-footprint reveal', () => {
		const output = analysisDefinitions.get('bfs')!.execute(
			graph([
				['A', 'B'],
				['A', 'C'],
				['B', 'D'],
				['C', 'E']
			]),
			{ mode: 'search', start: 'A', target: 'D' }
		);

		expect(output.result.outcome).toBe('complete');
		expect(output.result.artifacts).toContainEqual({
			kind: 'path',
			id: 'path',
			label: 'Found path',
			nodeIds: ['A', 'B', 'D'],
			edgeIds: ['e0', 'e2']
		});
		expect(output.result.artifacts).toContainEqual({
			kind: 'ordered-nodes',
			id: 'explored',
			label: 'Explored nodes',
			nodeIds: ['A', 'B', 'C', 'D']
		});
		expect(output.result.reveal?.phases).toHaveLength(1);
		expect(output.result.reveal?.phases[0].steps.at(-1)).toEqual({
			actions: [{ kind: 'emphasize-artifact', artifactId: 'path' }]
		});
		expect(structuredClone(output.result.reveal)).toEqual(output.result.reveal);
	});
});
