import type { GraphDocument } from '../model/types';
import type { AlgorithmOutput } from './types';
import { runAstar, runBfs, runDijkstra, type PathParams } from './pathfinding';

export interface AlgorithmNeeds {
	from: boolean;
	to: boolean;
	weighted: boolean;
}

export interface AlgorithmDefinition {
	id: string;
	name: string;
	description: string;
	needs: AlgorithmNeeds;
	run: (snapshot: GraphDocument, params: PathParams) => AlgorithmOutput;
}

const registry = new Map<string, AlgorithmDefinition>();

function register(def: AlgorithmDefinition): void {
	registry.set(def.id, def);
}

register({
	id: 'bfs',
	name: 'BFS',
	description: 'Unweighted breadth-first search (shortest by hop count).',
	needs: { from: true, to: true, weighted: false },
	run: runBfs
});

register({
	id: 'dijkstra',
	name: 'Dijkstra',
	description: 'Weighted shortest path using edge weights.',
	needs: { from: true, to: true, weighted: true },
	run: runDijkstra
});

register({
	id: 'astar',
	name: 'A*',
	description: 'Weighted shortest path with Euclidean 3D heuristic.',
	needs: { from: true, to: true, weighted: true },
	run: runAstar
});

export function listAlgorithms(): AlgorithmDefinition[] {
	return [...registry.values()];
}

export function getAlgorithm(id: string): AlgorithmDefinition | undefined {
	return registry.get(id);
}

/** Test/extension hook — registers or replaces an algorithm definition. */
export function registerAlgorithm(def: AlgorithmDefinition): void {
	register(def);
}
