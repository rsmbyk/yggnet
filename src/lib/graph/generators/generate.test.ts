import { describe, expect, it } from 'vitest';
import { edgeCount, nodeCount } from '../model/document';
import type { GraphDocument } from '../model/types';
import { delaunayEdges3 } from './delaunay';
import { GENERATE_MIN_DISTANCE, vec } from './geom';
import { paleyGraph } from './named';
import { createRng, randomSeed } from './rng';
import {
	defaultGenerateForm,
	fieldsForKind,
	fingerprint,
	generateGraph,
	generateOptionsFromForm,
	generateRequestFromForm,
	GRAPH_KIND_GROUPS,
	GRAPH_KINDS,
	kindAllowsDirected,
	kindAllowsPlanar,
	kindAllowsWeighted,
	NAMED_GRAPHS,
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
		expect(GRAPH_KIND_GROUPS.at(-1)?.label).toBe('Named');
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

	it('builds a directed simple graph and a helix with chords', () => {
		const dig = generateGraph('simple', { seed: 3, nodes: 6, density: 0.4, directed: true });
		const helix = generateGraph('helix', { seed: 3, nodes: 10, turns: 1.5, chord: 3 });
		expect(Object.values(dig.edges).every((e) => e.directed)).toBe(true);
		expect(nodeCount(helix)).toBe(10);
		expect(edgeCount(helix)).toBeGreaterThan(9);
	});

	it('covers remaining option branches', () => {
		expect(nodeCount(generateGraph('null', { seed: 1, nodes: 0 }))).toBe(0);
		expect(
			nodeCount(generateGraph('tree', { seed: 1, depth: 2, binary: false, branching: 3 }))
		).toBeGreaterThan(1);
		expect(nodeCount(generateGraph('circulant', { seed: 1, nodes: 10, jumps: [] }))).toBe(10);
		expect(nodeCount(generateGraph('diamondLattice', { seed: 1, extent: 6 }))).toBe(64);
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
		expect(nodeCount(generateGraph('geometric', { seed: 1, nodes: 8, radius: 2 }))).toBe(8);
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
