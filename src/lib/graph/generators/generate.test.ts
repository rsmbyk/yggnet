import { describe, expect, it } from 'vitest';
import { edgeCount, nodeCount } from '../model/document';
import type { GraphDocument } from '../model/types';
import { delaunayEdges3 } from './delaunay';
import { GENERATE_MIN_DISTANCE, vec } from './geom';
import { paleyGraph } from './named';
import { createRng, randomSeed } from './rng';
import {
	COMMUNITY_P_BETWEEN_HELP,
	COMMUNITY_P_INSIDE_HELP,
	DENSITY_FIELD_HELP,
	ATTACHMENTS_FIELD_HELP,
	DEGREE_FIELD_HELP,
	defaultGenerateForm,
	fieldsForKind,
	fingerprint,
	generateFieldLimit,
	generateGraph,
	generateOptionsFromForm,
	generateRequestFromForm,
	GRAPH_KIND_GROUPS,
	GRAPH_KINDS,
	kindAllowsDirected,
	kindAllowsPlanar,
	kindAllowsWeighted,
	kindHelp,
	NAMED_GRAPHS,
	NEIGHBORS_FIELD_HELP,
	PROBABILITY_RANGE_HELP,
	REWIRE_FIELD_HELP,
	RUNGS_FIELD_HELP,
	type GraphKind,
	type NamedGraphId
} from './generate';

function minPairwiseNodeDistance(doc: GraphDocument): number {
	const nodes = Object.values(doc.nodes);
	let min = Infinity;
	for (let i = 0; i < nodes.length; i += 1) {
		for (let j = i + 1; j < nodes.length; j += 1) {
			const a = nodes[i].position;
			const b = nodes[j].position;
			min = Math.min(min, Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z));
		}
	}
	return min;
}

function degrees(kindDoc: ReturnType<typeof generateGraph>): number[] {
	const deg = new Map<string, number>();
	for (const id of Object.keys(kindDoc.nodes)) deg.set(id, 0);
	for (const e of Object.values(kindDoc.edges)) {
		deg.set(e.from, (deg.get(e.from) ?? 0) + 1);
		deg.set(e.to, (deg.get(e.to) ?? 0) + 1);
	}
	return [...deg.values()].sort((a, b) => a - b);
}

function undirectedSimple(doc: ReturnType<typeof generateGraph>): boolean {
	const seen = new Set<string>();
	for (const e of Object.values(doc.edges)) {
		if (e.from === e.to) return false;
		const key = [e.from, e.to].sort().join('-');
		if (seen.has(key)) return false;
		seen.add(key);
	}
	return true;
}

describe('generateGraph', () => {
	it('is stable for the same seed and differs across seeds', () => {
		const a = generateGraph('simple', { seed: 7, nodes: 10, density: 0.4 });
		const b = generateGraph('simple', { seed: 7, nodes: 10, density: 0.4 });
		const c = generateGraph('simple', { seed: 8, nodes: 10, density: 0.4 });
		expect(fingerprint(a)).toBe(fingerprint(b));
		expect(fingerprint(a)).not.toBe(fingerprint(c));
	});

	it('varies unique topologies by embedding', () => {
		const a = generateGraph('cycle', { seed: 1, nodes: 8 });
		const b = generateGraph('cycle', { seed: 2, nodes: 8 });
		expect(nodeCount(a)).toBe(8);
		expect(edgeCount(a)).toBe(8);
		expect(fingerprint(a)).not.toBe(fingerprint(b));
	});

	it('builds a null graph with no edges', () => {
		const doc = generateGraph('null', { seed: 1, nodes: 6 });
		expect(nodeCount(doc)).toBe(6);
		expect(edgeCount(doc)).toBe(0);
	});

	it('builds a simple graph without loops or parallels', () => {
		const doc = generateGraph('simple', { seed: 3, nodes: 10, density: 0.5 });
		expect(undirectedSimple(doc)).toBe(true);
		expect(nodeCount(doc)).toBe(10);
		expect(edgeCount(doc)).toBe(23);
	});

	it('builds a k-regular graph with even n·k', () => {
		const doc = generateGraph('regular', { seed: 4, nodes: 10, degree: 3 });
		expect(nodeCount(doc)).toBe(10);
		expect(degrees(doc).every((d) => d === 3)).toBe(true);
	});

	it('builds a tournament with n(n-1)/2 directed edges', () => {
		const doc = generateGraph('tournament', { seed: 5, nodes: 7 });
		expect(nodeCount(doc)).toBe(7);
		expect(edgeCount(doc)).toBe(21);
		expect(Object.values(doc.edges).every((e) => e.directed)).toBe(true);
	});

	it('builds a tree with n-1 edges', () => {
		const doc = generateGraph('tree', { seed: 6, depth: 3, binary: true });
		expect(edgeCount(doc)).toBe(nodeCount(doc) - 1);
		expect(undirectedSimple(doc)).toBe(true);
	});

	it('builds a DAG with only forward edges in some topo order', () => {
		const doc = generateGraph('dag', { seed: 9, nodes: 8, density: 0.4 });
		expect(Object.values(doc.edges).every((e) => e.directed)).toBe(true);
		expect(nodeCount(doc)).toBe(8);
		expect(edgeCount(doc)).toBe(11);
	});

	it('honors large node counts instead of capping them', () => {
		const doc = generateGraph('simple', { seed: 1, nodes: 99 });
		expect(nodeCount(doc)).toBe(99);
	});

	it('builds grids larger than the old 40-node cap', () => {
		const doc = generateGraph('grid', { seed: 1, rows: 8, columns: 8 });
		expect(nodeCount(doc)).toBe(64);
	});

	it('assigns random weights when weighted', () => {
		const doc = generateGraph('grid', {
			seed: 11,
			rows: 3,
			columns: 3,
			weighted: true
		});
		const weights = Object.values(doc.edges).map((e) => e.weight);
		expect(weights.every((w) => w >= 1 && w <= 9)).toBe(true);
		expect(weights.some((w) => w !== 1)).toBe(true);
	});

	it.each(GRAPH_KINDS)('produces a document for kind %s', (kind: GraphKind) => {
		const extra =
			kind === 'delaunay3'
				? { nodes: 8 }
				: kind === 'hypercube'
					? { dimension: 3 }
					: kind === 'named'
						? { named: 'petersen' as const }
						: {};
		const doc = generateGraph(kind, { seed: 42, ...extra });
		if (kind === 'null') {
			expect(nodeCount(doc)).toBeGreaterThanOrEqual(0);
		} else {
			expect(nodeCount(doc)).toBeGreaterThan(0);
		}
		expect(doc.title.length).toBeGreaterThan(0);
	});
});

describe('named graphs', () => {
	const counts: Record<NamedGraphId, [number, number]> = {
		petersen: [10, 15],
		heawood: [14, 21],
		grotzsch: [11, 20],
		wagner: [8, 12],
		frucht: [12, 18],
		herschel: [11, 18],
		desargues: [20, 30],
		pappus: [18, 27],
		chvatal: [12, 24],
		coxeter: [28, 42],
		tutteCoxeter: [30, 45],
		clebsch: [16, 40],
		dyck: [32, 48],
		goldnerHarary: [11, 27],
		paley: [13, 39],
		sierpinskiGasket: [15, 27],
		cell24: [24, 96],
		csaszar: [7, 21],
		szilassi: [14, 21],
		stella: [8, 12],
		rhombicDodecahedron: [14, 24],
		sierpinskiTetrahedron: [10, 24]
	};

	it.each(NAMED_GRAPHS)('%s has the published order and size', (id: NamedGraphId) => {
		const doc = generateGraph('named', {
			seed: 1,
			named: id,
			paleyQ: 13,
			sierpinskiDepth: id === 'sierpinskiTetrahedron' ? 1 : 2
		});
		const [n, m] = counts[id];
		expect(nodeCount(doc)).toBe(n);
		expect(edgeCount(doc)).toBe(m);
	});
});

describe('kind metadata', () => {
	it('exposes fields for every kind', () => {
		for (const kind of GRAPH_KINDS) {
			expect(Array.isArray(fieldsForKind(kind))).toBe(true);
		}
	});

	it('lists every catalog named graph on the main picker', () => {
		const namedGroup = GRAPH_KIND_GROUPS.find((g) => g.label === 'Named');
		expect(namedGroup).toBeTruthy();
		const ids = namedGroup!.kinds.map((k) => k.id);
		expect(ids).not.toContain('named');
		for (const id of NAMED_GRAPHS) {
			expect(ids).toContain(id);
		}
		expect(ids).toContain('generalizedPetersen');
		expect(ids.indexOf('petersen')).toBeLessThan(ids.indexOf('generalizedPetersen'));
		expect(ids.indexOf('generalizedPetersen')).toBeLessThan(ids.indexOf('heawood'));
		expect(GRAPH_KIND_GROUPS.at(-1)?.label).toBe('Named');
	});

	it('has a one-line helper for every Generate type', () => {
		const ids = GRAPH_KIND_GROUPS.flatMap((g) => g.kinds.map((k) => k.id));
		expect(ids.length).toBeGreaterThan(20);
		for (const id of ids) {
			const help = kindHelp(id);
			expect(help.length).toBeGreaterThan(12);
			expect(help).not.toMatch(/\n/);
		}
		expect(kindHelp('simple')).toMatch(/density/i);
		expect(kindHelp('null')).toMatch(/no edges/i);
		expect(COMMUNITY_P_INSIDE_HELP).toMatch(/same group/i);
		expect(COMMUNITY_P_BETWEEN_HELP).toMatch(/different groups/i);
		expect(COMMUNITY_P_INSIDE_HELP).toMatch(/0 to 1, step 0\.01/);
		expect(COMMUNITY_P_BETWEEN_HELP).toMatch(/0 to 1, step 0\.01/);
		expect(DENSITY_FIELD_HELP).toMatch(/0 to 1, step 0\.01/);
		expect(REWIRE_FIELD_HELP).toMatch(/0 to 1, step 0\.01/);
		expect(PROBABILITY_RANGE_HELP).toBe('From 0 to 1, step 0.01.');
		expect(ATTACHMENTS_FIELD_HELP).toMatch(/hubs/i);
		expect(DEGREE_FIELD_HELP).toMatch(/nodes − 1|nodes - 1/);
		expect(NEIGHBORS_FIELD_HELP).toMatch(/ring/i);
		expect(RUNGS_FIELD_HELP).toMatch(/3 to 20/);
		expect(COMMUNITY_P_INSIDE_HELP).not.toMatch(/\n/);
		expect(COMMUNITY_P_BETWEEN_HELP).not.toMatch(/\n/);
	});

	it('allows Multi to request more than eighty edges', () => {
		expect(edgeCount(generateGraph('multi', { seed: 1, nodes: 6, extraEdges: 120 }))).toBe(120);
	});

	it('no longer offers Random geometric', () => {
		expect(GRAPH_KINDS).not.toContain('geometric');
		expect(GRAPH_KIND_GROUPS.flatMap((g) => g.kinds.map((k) => k.id))).not.toContain('geometric');
	});

	it('lays tree with root on top and children under their parent', () => {
		const tree = generateGraph('tree', { seed: 1, depth: 2, binary: true, nodeY: 1 });
		const nodes = Object.values(tree.nodes);
		const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
		const rootZ = Math.min(...nodes.map((n) => n.position.z));
		expect(nodes.some((n) => n.position.z > rootZ)).toBe(true);
		for (const e of Object.values(tree.edges)) {
			const a = byId[e.from];
			const b = byId[e.to];
			const parent = a.position.z <= b.position.z ? a : b;
			const child = parent === a ? b : a;
			expect(parent.position.z).toBeLessThan(child.position.z);
		}
	});

	it('keeps grid rows wider than columns are tall', () => {
		const grid = generateGraph('grid', { seed: 1, rows: 3, columns: 4, nodeY: 1 });
		const xs = Object.values(grid.nodes).map((n) => n.position.x);
		const gzs = Object.values(grid.nodes).map((n) => n.position.z);
		expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(Math.max(...gzs) - Math.min(...gzs));
	});

	it('keeps 3D graphs upright and off the floor', () => {
		const doc = generateGraph('platonic', { seed: 1, platonic: 'cube', nodeY: 1 });
		const ys = Object.values(doc.nodes).map((n) => n.position.y);
		expect(Math.min(...ys)).toBeGreaterThanOrEqual(2 - 1e-6);
		const sameSeedA = generateGraph('platonic', { seed: 7, platonic: 'cube', nodeY: 1 });
		const sameSeedB = generateGraph('platonic', { seed: 7, platonic: 'cube', nodeY: 1 });
		expect(fingerprint(sameSeedA)).toBe(fingerprint(sameSeedB));
	});

	it('mirrors generator floors and ceilings on each Generate field', () => {
		expect(generateFieldLimit('null', 'nodes')).toEqual({ min: 0 });
		expect(generateFieldLimit('complete', 'nodes')).toEqual({ min: 1 });
		expect(generateFieldLimit('multi', 'nodes')).toEqual({ min: 2 });
		expect(generateFieldLimit('multi', 'extraEdges')).toEqual({ min: 0 });
		expect(generateFieldLimit('cycle', 'nodes')).toEqual({ min: 3 });
		expect(generateFieldLimit('scaleFree', 'nodes')).toEqual({ min: 3 });
		expect(generateFieldLimit('wheel', 'nodes')).toEqual({ min: 4 });
		expect(generateFieldLimit('smallWorld', 'nodes')).toEqual({ min: 4 });
		expect(generateFieldLimit('smallWorld', 'neighbors', { nodes: 12 })).toEqual({
			min: 2,
			max: 10
		});
		expect(generateFieldLimit('knn', 'neighbors', { nodes: 12 })).toEqual({ min: 1, max: 11 });
		expect(generateFieldLimit('regular', 'degree', { nodes: 12 })).toEqual({ min: 0, max: 11 });
		expect(generateFieldLimit('scaleFree', 'attachments', { nodes: 4 })).toEqual({
			min: 1,
			max: 3
		});
		expect(generateFieldLimit('scaleFree', 'attachments', { nodes: 40 })).toEqual({
			min: 1,
			max: 5
		});
		expect(generateFieldLimit('grid', 'rows')).toEqual({ min: 1 });
		expect(generateFieldLimit('cubicLattice', 'rows')).toEqual({ min: 1 });
		expect(generateFieldLimit('cubicLattice', 'layers')).toEqual({ min: 1 });
		expect(generateFieldLimit('prism', 'nGons')).toEqual({ min: 3, max: 20 });
		expect(generateFieldLimit('antiprism', 'nGons')).toEqual({ min: 3 });
		expect(generateFieldLimit('helix', 'turns')).toEqual({ min: 0.5 });
		expect(generateFieldLimit('helix', 'chord', { nodes: 16 })).toEqual({ min: 0, max: 15 });
		expect(generateFieldLimit('unitBall', 'radius')).toEqual({ min: 0.2 });
		expect(generateFieldLimit('communities', 'groups', { nodes: 12 })).toEqual({ min: 2, max: 12 });
		expect(generateFieldLimit('generalizedPetersen', 'petersenK', { petersenN: 8 })).toEqual({
			min: 1,
			max: 3
		});
		expect(generateFieldLimit('sierpinskiGasket', 'sierpinskiDepth')).toEqual({ min: 0 });
		expect(generateFieldLimit('tree', 'depth')).toEqual({ min: 1 });
		expect(generateFieldLimit('tree', 'branching')).toEqual({ min: 2 });
		expect(generateFieldLimit('hypercube', 'dimension')).toEqual({ min: 2 });
		expect(generateFieldLimit('diamondLattice', 'extent')).toEqual({ min: 1 });
		expect(generateFieldLimit('torusGrid', 'rings')).toEqual({ min: 3 });
		expect(generateFieldLimit('torusGrid', 'segments')).toEqual({ min: 3 });
	});

	it('no longer caps Sierpinski depth at two', () => {
		const d2 = nodeCount(
			generateGraph('named', { seed: 1, named: 'sierpinskiGasket', sierpinskiDepth: 2 })
		);
		const d3 = nodeCount(
			generateGraph('named', { seed: 1, named: 'sierpinskiGasket', sierpinskiDepth: 3 })
		);
		expect(d3).toBeGreaterThan(d2);
	});

	it('exposes Paley and Sierpinski fields from the picker id', () => {
		expect(fieldsForKind('paley')).toContain('paleyQ');
		expect(fieldsForKind('sierpinskiGasket')).toContain('sierpinskiDepth');
		expect(fieldsForKind('petersen')).toEqual([]);
	});

	it('allows weighted/directed on simple but not on tree', () => {
		expect(kindAllowsWeighted('simple')).toBe(true);
		expect(kindAllowsDirected('simple')).toBe(true);
		expect(kindAllowsWeighted('tree')).toBe(false);
		expect(kindAllowsDirected('tournament')).toBe(false);
	});

	it('offers a 2D drawing only for prism, hypercube, and Goldner–Harary', () => {
		expect(kindAllowsPlanar('prism')).toBe(true);
		expect(kindAllowsPlanar('hypercube')).toBe(true);
		expect(kindAllowsPlanar('goldnerHarary')).toBe(true);
		expect(kindAllowsPlanar('simple')).toBe(false);
		expect(kindAllowsPlanar('petersen')).toBe(false);
		expect(kindAllowsPlanar('platonic')).toBe(false);
		expect(kindAllowsPlanar('helix')).toBe(false);
		expect(kindAllowsPlanar('cell24')).toBe(false);
	});
});

describe('solids and extra options', () => {
	it.each(['tetrahedron', 'cube', 'octahedron', 'dodecahedron', 'icosahedron'] as const)(
		'platonic %s stays under 40 nodes',
		(solid) => {
			const doc = generateGraph('platonic', { seed: 2, platonic: solid });
			expect(nodeCount(doc)).toBeGreaterThan(3);
			expect(nodeCount(doc)).toBeLessThanOrEqual(40);
		}
	);

	it.each([
		'truncatedTetrahedron',
		'cuboctahedron',
		'truncatedCube',
		'truncatedOctahedron',
		'rhombicuboctahedron',
		'snubCube',
		'icosidodecahedron'
	] as const)('archimedean %s stays under 40 nodes', (solid) => {
		const doc = generateGraph('archimedean', { seed: 2, archimedean: solid });
		expect(nodeCount(doc)).toBeGreaterThan(5);
		expect(nodeCount(doc)).toBeLessThanOrEqual(40);
	});

	it('builds Paley graphs over prime squares', () => {
		const nine = generateGraph('named', { seed: 1, named: 'paley', paleyQ: 9 });
		const twentyFive = generateGraph('named', { seed: 1, named: 'paley', paleyQ: 25 });
		expect(nodeCount(nine)).toBe(9);
		expect(nodeCount(twentyFive)).toBe(25);
	});

	it('orients a complete graph both ways', () => {
		const doc = generateGraph('complete', { seed: 1, nodes: 4, directed: true });
		expect(edgeCount(doc)).toBe(12);
		expect(Object.values(doc.edges).every((e) => e.directed)).toBe(true);
	});

	it('allows loops on a multi graph', () => {
		const doc = generateGraph('multi', { seed: 1, nodes: 4, extraEdges: 20, loops: true });
		expect(edgeCount(doc)).toBe(20);
	});

	it('builds a fan pyramid and a 4-cube', () => {
		const fan = generateGraph('pyramid', { seed: 1, nGons: 5, fan: true });
		const q4 = generateGraph('hypercube', { seed: 1, dimension: 4 });
		expect(nodeCount(fan)).toBe(6);
		expect(nodeCount(q4)).toBe(16);
	});

	it('builds diagonal grids and a generalized Petersen graph', () => {
		const grid = generateGraph('grid', { seed: 1, rows: 3, columns: 3, diagonals: true });
		const gp = generateGraph('generalizedPetersen', { seed: 1, petersenN: 7, petersenK: 2 });
		expect(nodeCount(grid)).toBe(9);
		expect(edgeCount(grid)).toBeGreaterThan(12);
		expect(nodeCount(gp)).toBe(14);
	});

	it('picks a fixed number of random pairs from density', () => {
		const ten = generateGraph('simple', { seed: 1, nodes: 10, density: 0.1 });
		const none = generateGraph('simple', { seed: 1, nodes: 10, density: 0 });
		const all = generateGraph('simple', { seed: 1, nodes: 10, density: 1 });
		const a = generateGraph('simple', { seed: 1, nodes: 10, density: 0.1 });
		const b = generateGraph('simple', { seed: 2, nodes: 10, density: 0.1 });
		expect(edgeCount(ten)).toBe(5);
		expect(edgeCount(none)).toBe(0);
		expect(edgeCount(all)).toBe(45);
		expect(fingerprint(a)).not.toBe(fingerprint(b));
		const dig = generateGraph('simple', { seed: 3, nodes: 6, density: 0.4, directed: true });
		expect(Object.values(dig.edges).every((e) => e.directed)).toBe(true);
		expect(edgeCount(dig)).toBe(12);
		const bi = generateGraph('bipartite', { seed: 1, left: 4, right: 5, density: 0.5 });
		expect(edgeCount(bi)).toBe(10);
	});

	it('builds a helix with chords', () => {
		const helix = generateGraph('helix', { seed: 3, nodes: 10, turns: 1.5, chord: 3 });
		expect(nodeCount(helix)).toBe(10);
		expect(edgeCount(helix)).toBeGreaterThan(9);
	});

	it('covers remaining option branches', () => {
		expect(nodeCount(generateGraph('null', { seed: 1, nodes: 0 }))).toBe(0);
		expect(
			nodeCount(generateGraph('tree', { seed: 1, depth: 2, binary: false, branching: 3 }))
		).toBeGreaterThan(1);
		expect(nodeCount(generateGraph('circulant', { seed: 1, nodes: 10, jumps: [] }))).toBe(10);
		expect(nodeCount(generateGraph('diamondLattice', { seed: 1, extent: 4 }))).toBe(64);
		expect(nodeCount(generateGraph('diamondLattice', { seed: 1, extent: 5 }))).toBeGreaterThan(64);
		expect(nodeCount(generateGraph('grid', { seed: 1, rows: 20, columns: 20 }))).toBe(400);
		expect(nodeCount(generateGraph('hexGrid', { seed: 1, rows: 20, columns: 20 }))).toBe(400);
		expect(nodeCount(generateGraph('torusGrid', { seed: 1, rings: 20, segments: 20 }))).toBe(400);
		expect(
			nodeCount(generateGraph('cubicLattice', { seed: 1, rows: 6, columns: 6, layers: 6 }))
		).toBe(216);
		expect(
			degrees(generateGraph('regular', { seed: 1, nodes: 9, degree: 3 })).every((d) => d === 2)
		).toBe(true);
		expect(
			nodeCount(generateGraph('smallWorld', { seed: 1, nodes: 12, neighbors: 3, rewire: 1 }))
		).toBe(12);
		expect(nodeCount(generateGraph('scaleFree', { seed: 1, nodes: 15, attachments: 2 }))).toBe(15);
		expect(
			nodeCount(generateGraph('bipartite', { seed: 1, left: 4, right: 5, density: 0.5 }))
		).toBe(9);
		expect(nodeCount(generateGraph('knn', { seed: 1, nodes: 8, neighbors: 2 }))).toBe(8);
		expect(nodeCount(generateGraph('unitBall', { seed: 1, nodes: 8, radius: 2 }))).toBe(8);
		expect(nodeCount(generateGraph('spherical', { seed: 1, nodes: 8, radius: 2 }))).toBe(8);
		expect(nodeCount(generateGraph('prism', { seed: 1, nGons: 5 }))).toBe(10);
		expect(nodeCount(generateGraph('mobiusLadder', { seed: 1, rungs: 5 }))).toBe(10);
		expect(nodeCount(generateGraph('antiprism', { seed: 1, nGons: 4 }))).toBe(8);
		expect(nodeCount(generateGraph('cycle', { seed: 1, nodes: 6, directed: true }))).toBe(6);
		expect(edgeCount(generateGraph('complete', { seed: 1, nodes: 5 }))).toBe(10);
		expect(
			nodeCount(generateGraph('named', { seed: 1, named: 'sierpinskiGasket', sierpinskiDepth: 0 }))
		).toBe(3);
		expect(nodeCount(generateGraph('named', { seed: 1, named: 'paley', paleyQ: 7 }))).toBe(13);
		expect(nodeCount(generateGraph('wheel', { seed: 1, nodes: 7 }))).toBe(7);
		expect(
			nodeCount(generateGraph('multi', { seed: 1, nodes: 5, extraEdges: 4, loops: false }))
		).toBe(5);
		const seeded = generateGraph('simple', { nodes: 5, density: 0.3 });
		expect(nodeCount(seeded)).toBe(5);
	});

	it.each(GRAPH_KINDS)('%s keeps node centers at least 4 world units apart', (kind) => {
		const doc = generateGraph(kind, { seed: 11, nodes: 12, rows: 3, columns: 3, layers: 2 });
		expect(nodeCount(doc)).toBeGreaterThanOrEqual(2);
		expect(minPairwiseNodeDistance(doc)).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
	});

	it.each(['simple', 'prism', 'hypercube'] as const)(
		'%s planar drawing keeps every node on the XZ plane',
		(kind) => {
			const a = generateGraph(kind, { seed: 19, nodes: 12, nGons: 6, dimension: 3, planar: true });
			const b = generateGraph(kind, { seed: 19, nodes: 12, nGons: 6, dimension: 3, planar: true });
			expect(fingerprint(a)).toBe(fingerprint(b));
			expect(minPairwiseNodeDistance(a)).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
			for (const node of Object.values(a.nodes)) {
				expect(node.position.y).toBeCloseTo(0, 6);
			}
		}
	);

	it('grows a Null graph on the floor instead of stacking at 43 nodes', () => {
		const a = generateGraph('null', { seed: 3, nodes: 42 });
		const b = generateGraph('null', { seed: 3, nodes: 43 });
		for (const node of [...Object.values(a.nodes), ...Object.values(b.nodes)]) {
			expect(node.position.y).toBeCloseTo(0, 6);
		}
		expect(minPairwiseNodeDistance(a)).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
		expect(minPairwiseNodeDistance(b)).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
		const radius = (doc: GraphDocument) =>
			Math.max(...Object.values(doc.nodes).map((n) => Math.hypot(n.position.x, n.position.z)));
		expect(radius(b)).toBeGreaterThan(radius(a));
	});

	it('still uses height for a default Prism', () => {
		const doc = generateGraph('prism', { seed: 1, nGons: 6 });
		const ys = Object.values(doc.nodes).map((n) => n.position.y);
		expect(Math.max(...ys) - Math.min(...ys)).toBeGreaterThan(1);
	});
});

type Xz = { x: number; z: number };

function nodeXz(doc: GraphDocument): Xz[] {
	return Object.values(doc.nodes).map((n) => ({ x: n.position.x, z: n.position.z }));
}

function xzDist(a: Xz, b: Xz): number {
	return Math.hypot(a.x - b.x, a.z - b.z);
}

function xzCentroid(pts: Xz[]): Xz {
	const n = pts.length || 1;
	return {
		x: pts.reduce((s, p) => s + p.x, 0) / n,
		z: pts.reduce((s, p) => s + p.z, 0) / n
	};
}

function xzCircumradius(pts: Xz[]): number {
	const c = xzCentroid(pts);
	return Math.max(0, ...pts.map((p) => xzDist(p, c)));
}

/** Split a ring of clusters on the g largest angular gaps. */
function clustersByAngle(pts: Xz[], groups: number): Xz[][] {
	const tagged = pts.map((p) => ({ ...p, a: Math.atan2(p.z, p.x) }));
	tagged.sort((a, b) => a.a - b.a);
	const gaps = tagged.map((p, i) => {
		const next = tagged[(i + 1) % tagged.length];
		let d = next.a - p.a;
		if (d < 0) d += Math.PI * 2;
		return { after: i, d };
	});
	const splitAfter = new Set(
		[...gaps]
			.sort((a, b) => b.d - a.d)
			.slice(0, groups)
			.map((g) => g.after)
	);
	const clusters: Xz[][] = [];
	let current: Xz[] = [];
	for (let i = 0; i < tagged.length; i += 1) {
		current.push({ x: tagged[i].x, z: tagged[i].z });
		if (splitAfter.has(i)) {
			clusters.push(current);
			current = [];
		}
	}
	if (current.length) {
		if (clusters.length) clusters[0] = current.concat(clusters[0]);
		else clusters.push(current);
	}
	return clusters.filter((c) => c.length > 0);
}

function adjacentCentroidDistances(clusters: Xz[][]): number[] {
	const cs = clusters.map(xzCentroid);
	const g = cs.length;
	const ds: number[] = [];
	for (let i = 0; i < g; i += 1) ds.push(xzDist(cs[i], cs[(i + 1) % g]));
	return ds;
}

describe('communities layout', () => {
	it('spaces singleton groups 3× keep-out apart', () => {
		const doc = generateGraph('communities', { seed: 4, nodes: 3, groups: 3 });
		expect(nodeCount(doc)).toBe(3);
		const pts = nodeXz(doc);
		expect(xzDist(pts[0], pts[1])).toBeCloseTo(3 * GENERATE_MIN_DISTANCE, 5);
		expect(xzDist(pts[1], pts[2])).toBeCloseTo(3 * GENERATE_MIN_DISTANCE, 5);
		expect(xzDist(pts[2], pts[0])).toBeCloseTo(3 * GENERATE_MIN_DISTANCE, 5);
	});

	it('lays out each group like Simple and puts adjacent centers at 3R', () => {
		const groups = 3;
		const doc = generateGraph('communities', { seed: 9, nodes: 12, groups });
		const clusters = clustersByAngle(nodeXz(doc), groups);
		expect(clusters).toHaveLength(groups);
		expect(clusters.map((c) => c.length).sort()).toEqual([4, 4, 4]);
		const R = Math.max(...clusters.map(xzCircumradius));
		expect(R).toBeGreaterThan(1);
		for (const d of adjacentCentroidDistances(clusters)) {
			expect(d).toBeCloseTo(3 * R, 5);
		}
		expect(minPairwiseNodeDistance(doc)).toBeGreaterThanOrEqual(GENERATE_MIN_DISTANCE - 1e-6);
	});

	it('does not clamp groups at eight', () => {
		const eight = generateGraph('communities', { seed: 1, nodes: 24, groups: 8 });
		const twelve = generateGraph('communities', { seed: 1, nodes: 24, groups: 12 });
		expect(fingerprint(twelve)).not.toBe(fingerprint(eight));
	});

	it('caps groups at the node count', () => {
		const atNodes = generateGraph('communities', { seed: 7, nodes: 10, groups: 10 });
		const above = generateGraph('communities', { seed: 7, nodes: 10, groups: 40 });
		expect(fingerprint(above)).toBe(fingerprint(atNodes));
	});

	it('uses a larger ring when the fattest group grows', () => {
		const small = generateGraph('communities', { seed: 2, nodes: 12, groups: 3 });
		const large = generateGraph('communities', { seed: 2, nodes: 30, groups: 3 });
		const rSmall = Math.max(...clustersByAngle(nodeXz(small), 3).map(xzCircumradius));
		const rLarge = Math.max(...clustersByAngle(nodeXz(large), 3).map(xzCircumradius));
		expect(rLarge).toBeGreaterThan(rSmall);
		const dSmall = Math.min(...adjacentCentroidDistances(clustersByAngle(nodeXz(small), 3)));
		const dLarge = Math.min(...adjacentCentroidDistances(clustersByAngle(nodeXz(large), 3)));
		expect(dSmall).toBeCloseTo(3 * rSmall, 5);
		expect(dLarge).toBeCloseTo(3 * rLarge, 5);
	});
});

describe('generateOptionsFromForm', () => {
	it('starts from Simple defaults and parses jump lists', () => {
		const form = defaultGenerateForm();
		expect(form.kind).toBe('simple');
		expect(form.nodes).toBe(12);
		expect(generateRequestFromForm(form).kind).toBe('simple');
		form.kind = 'circulant';
		form.jumps = '1, 3';
		form.directed = true;
		const opts = generateOptionsFromForm(form);
		expect(opts.jumps).toEqual([1, 3]);
		expect(opts.directed).toBe(true);
	});

	it('maps a catalog named picker onto generateGraph named', () => {
		const form = defaultGenerateForm();
		form.kind = 'petersen';
		const req = generateRequestFromForm(form);
		expect(req.kind).toBe('named');
		expect(req.options.named).toBe('petersen');
	});

	it('passes planar when the picker allows a 2D drawing', () => {
		const form = defaultGenerateForm();
		form.planar = true;
		expect(generateOptionsFromForm(form).planar).toBe(false);
		form.kind = 'prism';
		expect(generateOptionsFromForm(form).planar).toBe(true);
		form.kind = 'goldnerHarary';
		expect(generateOptionsFromForm(form).planar).toBe(true);
		form.kind = 'simple';
		expect(generateOptionsFromForm(form).planar).toBe(false);
	});
});

describe('delaunay and rng helpers', () => {
	it('connects tiny and coplanar point sets', () => {
		expect(delaunayEdges3([vec(0, 0, 0), vec(1, 0, 0)]).length).toBe(1);
		expect(delaunayEdges3([]).length).toBe(0);
		const planar = delaunayEdges3([vec(0, 0, 0), vec(1, 0, 0), vec(0, 0, 1), vec(1, 0, 1)]);
		expect(planar.length).toBeGreaterThan(0);
	});

	it('creates seeds and clamps rng ranges', () => {
		expect(typeof randomSeed()).toBe('number');
		const rng = createRng(1);
		expect(rng.int(5, 3)).toBe(5);
		expect(rng.chance(0)).toBe(false);
		expect(paleyGraph(4).points.length).toBe(13);
	});
});
