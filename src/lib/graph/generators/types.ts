/** Graph-theory kinds offered by Generate. */

export const GRAPH_KINDS = [
	'null',
	'simple',
	'multi',
	'scaleFree',
	'communities',
	'cycle',
	'wheel',
	'regular',
	'complete',
	'tournament',
	'smallWorld',
	'circulant',
	'prism',
	'mobiusLadder',
	'hypercube',
	'named',
	'generalizedPetersen',
	'tree',
	'dag',
	'bipartite',
	'grid',
	'hexGrid',
	'geometric',
	'knn',
	'platonic',
	'archimedean',
	'antiprism',
	'pyramid',
	'cubicLattice',
	'diamondLattice',
	'unitBall',
	'spherical',
	'delaunay3',
	'helix',
	'torusGrid'
] as const;

export type GraphKind = (typeof GRAPH_KINDS)[number];

export const NAMED_GRAPHS = [
	'petersen',
	'heawood',
	'grotzsch',
	'wagner',
	'frucht',
	'herschel',
	'desargues',
	'pappus',
	'chvatal',
	'coxeter',
	'tutteCoxeter',
	'clebsch',
	'dyck',
	'goldnerHarary',
	'paley',
	'sierpinskiGasket',
	'cell24',
	'csaszar',
	'szilassi',
	'stella',
	'rhombicDodecahedron',
	'sierpinskiTetrahedron'
] as const;

export type NamedGraphId = (typeof NAMED_GRAPHS)[number];

export const PLATONIC_SOLIDS = [
	'tetrahedron',
	'cube',
	'octahedron',
	'dodecahedron',
	'icosahedron'
] as const;

export type PlatonicSolid = (typeof PLATONIC_SOLIDS)[number];

export const ARCHIMEDEAN_SOLIDS = [
	'truncatedTetrahedron',
	'cuboctahedron',
	'truncatedCube',
	'truncatedOctahedron',
	'rhombicuboctahedron',
	'snubCube',
	'icosidodecahedron'
] as const;

export type ArchimedeanSolid = (typeof ARCHIMEDEAN_SOLIDS)[number];

export const PALEY_ORDERS = [5, 9, 13, 17, 25, 29, 37] as const;

export const MAX_GRAPH_NODES = 40;

/** Options for {@link generateGraph}. Unspecified fields use per-kind defaults. */
export interface GenerateOptions {
	seed?: number;
	/** Y offset added to generated positions (session passes world default Y). */
	nodeY?: number;
	nodes?: number;
	density?: number;
	extraEdges?: number;
	loops?: boolean;
	directed?: boolean;
	weighted?: boolean;
	degree?: number;
	transitive?: boolean;
	named?: NamedGraphId;
	paleyQ?: number;
	sierpinskiDepth?: number;
	depth?: number;
	binary?: boolean;
	branching?: number;
	left?: number;
	right?: number;
	attachments?: number;
	neighbors?: number;
	rewire?: number;
	jumps?: number[];
	rungs?: number;
	fan?: boolean;
	rows?: number;
	columns?: number;
	layers?: number;
	diagonals?: boolean;
	radius?: number;
	groups?: number;
	pInside?: number;
	pBetween?: number;
	nGons?: number;
	dimension?: number;
	platonic?: PlatonicSolid;
	archimedean?: ArchimedeanSolid;
	extent?: number;
	turns?: number;
	chord?: number;
	rings?: number;
	segments?: number;
	petersenN?: number;
	petersenK?: number;
}

export type KindField =
	| 'nodes'
	| 'density'
	| 'extraEdges'
	| 'loops'
	| 'directed'
	| 'degree'
	| 'transitive'
	| 'named'
	| 'paleyQ'
	| 'sierpinskiDepth'
	| 'depth'
	| 'binary'
	| 'branching'
	| 'left'
	| 'right'
	| 'attachments'
	| 'neighbors'
	| 'rewire'
	| 'jumps'
	| 'rungs'
	| 'fan'
	| 'rows'
	| 'columns'
	| 'layers'
	| 'diagonals'
	| 'radius'
	| 'groups'
	| 'pInside'
	| 'pBetween'
	| 'nGons'
	| 'dimension'
	| 'platonic'
	| 'archimedean'
	| 'extent'
	| 'turns'
	| 'chord'
	| 'rings'
	| 'segments'
	| 'petersenN'
	| 'petersenK';

const KIND_FIELDS: Record<GraphKind, readonly KindField[]> = {
	null: ['nodes'],
	simple: ['nodes', 'density'],
	multi: ['nodes', 'extraEdges', 'loops'],
	scaleFree: ['nodes', 'attachments'],
	communities: ['nodes', 'groups', 'pInside', 'pBetween'],
	cycle: ['nodes', 'directed'],
	wheel: ['nodes'],
	regular: ['nodes', 'degree'],
	complete: ['nodes', 'directed'],
	tournament: ['nodes', 'transitive'],
	smallWorld: ['nodes', 'neighbors', 'rewire'],
	circulant: ['nodes', 'jumps'],
	prism: ['nGons'],
	mobiusLadder: ['rungs'],
	hypercube: ['dimension'],
	named: ['named', 'paleyQ', 'sierpinskiDepth'],
	generalizedPetersen: ['petersenN', 'petersenK'],
	tree: ['depth', 'binary', 'branching'],
	dag: ['nodes', 'density'],
	bipartite: ['left', 'right', 'density'],
	grid: ['rows', 'columns', 'diagonals'],
	hexGrid: ['rows', 'columns'],
	geometric: ['nodes', 'radius'],
	knn: ['nodes', 'neighbors'],
	platonic: ['platonic'],
	archimedean: ['archimedean'],
	antiprism: ['nGons'],
	pyramid: ['nGons', 'fan'],
	cubicLattice: ['rows', 'columns', 'layers', 'diagonals'],
	diamondLattice: ['extent'],
	unitBall: ['nodes', 'radius'],
	spherical: ['nodes', 'radius'],
	delaunay3: ['nodes'],
	helix: ['nodes', 'turns', 'chord'],
	torusGrid: ['rings', 'segments']
};

const SHARED_WEIGHTED: ReadonlySet<GraphKind> = new Set([
	'simple',
	'multi',
	'scaleFree',
	'communities',
	'smallWorld',
	'circulant',
	'bipartite',
	'grid',
	'hexGrid',
	'geometric',
	'knn',
	'cubicLattice',
	'unitBall',
	'spherical'
]);

const SHARED_DIRECTED: ReadonlySet<GraphKind> = new Set([
	'simple',
	'multi',
	'scaleFree',
	'communities',
	'cycle',
	'complete',
	'smallWorld',
	'circulant',
	'bipartite',
	'grid',
	'hexGrid',
	'geometric',
	'knn',
	'cubicLattice',
	'unitBall',
	'spherical'
]);

export function fieldsForKind(kind: GraphKind): readonly KindField[] {
	return KIND_FIELDS[kind];
}

export function kindAllowsWeighted(kind: GraphKind): boolean {
	return SHARED_WEIGHTED.has(kind);
}

export function kindAllowsDirected(kind: GraphKind): boolean {
	return SHARED_DIRECTED.has(kind);
}

export const GRAPH_KIND_GROUPS: { label: string; kinds: { id: GraphKind; label: string }[] }[] = [
	{
		label: 'Empty & random',
		kinds: [
			{ id: 'null', label: 'Null Graph' },
			{ id: 'simple', label: 'Simple Graph' },
			{ id: 'multi', label: 'Multi Graph' },
			{ id: 'scaleFree', label: 'Scale-free' },
			{ id: 'communities', label: 'Communities' }
		]
	},
	{
		label: 'Regular & complete',
		kinds: [
			{ id: 'cycle', label: 'Cycle Graph' },
			{ id: 'wheel', label: 'Wheel Graph' },
			{ id: 'regular', label: 'Regular Graph' },
			{ id: 'complete', label: 'Full/Complete' },
			{ id: 'tournament', label: 'Tournament' },
			{ id: 'smallWorld', label: 'Small-world' },
			{ id: 'circulant', label: 'Circulant' },
			{ id: 'prism', label: 'Prism' },
			{ id: 'mobiusLadder', label: 'Möbius ladder' },
			{ id: 'hypercube', label: 'Hypercube' }
		]
	},
	{
		label: 'Named',
		kinds: [
			{ id: 'named', label: 'Named graph' },
			{ id: 'generalizedPetersen', label: 'Generalized Petersen' }
		]
	},
	{
		label: 'Acyclic & partitioned',
		kinds: [
			{ id: 'tree', label: 'Tree' },
			{ id: 'dag', label: 'DAG' },
			{ id: 'bipartite', label: 'Bipartite Graph' }
		]
	},
	{
		label: 'Spatial',
		kinds: [
			{ id: 'grid', label: 'Grid' },
			{ id: 'hexGrid', label: 'Hex grid' },
			{ id: 'geometric', label: 'Random geometric' },
			{ id: 'knn', label: 'k-nearest neighbors' }
		]
	},
	{
		label: '3D',
		kinds: [
			{ id: 'platonic', label: 'Platonic solid' },
			{ id: 'archimedean', label: 'Archimedean solid' },
			{ id: 'antiprism', label: 'Antiprism' },
			{ id: 'pyramid', label: 'Pyramid' },
			{ id: 'cubicLattice', label: 'Cubic lattice' },
			{ id: 'diamondLattice', label: 'Diamond lattice' },
			{ id: 'unitBall', label: 'Unit-ball geometric' },
			{ id: 'spherical', label: 'Spherical' },
			{ id: 'delaunay3', label: '3D Delaunay' },
			{ id: 'helix', label: 'Helix' },
			{ id: 'torusGrid', label: 'Torus grid' }
		]
	}
];

export const NAMED_GRAPH_LABELS: Record<NamedGraphId, string> = {
	petersen: 'Petersen',
	heawood: 'Heawood',
	grotzsch: 'Grötzsch',
	wagner: 'Wagner',
	frucht: 'Frucht',
	herschel: 'Herschel',
	desargues: 'Desargues',
	pappus: 'Pappus',
	chvatal: 'Chvátal',
	coxeter: 'Coxeter',
	tutteCoxeter: 'Tutte–Coxeter',
	clebsch: 'Clebsch',
	dyck: 'Dyck',
	goldnerHarary: 'Goldner–Harary',
	paley: 'Paley',
	sierpinskiGasket: 'Sierpinski gasket',
	cell24: '24-cell',
	csaszar: 'Császár',
	szilassi: 'Szilassi',
	stella: 'Stella octangula',
	rhombicDodecahedron: 'Rhombic dodecahedron',
	sierpinskiTetrahedron: 'Sierpinski tetrahedron'
};

export const PLATONIC_LABELS: Record<PlatonicSolid, string> = {
	tetrahedron: 'Tetrahedron',
	cube: 'Cube',
	octahedron: 'Octahedron',
	dodecahedron: 'Dodecahedron',
	icosahedron: 'Icosahedron'
};

export const ARCHIMEDEAN_LABELS: Record<ArchimedeanSolid, string> = {
	truncatedTetrahedron: 'Truncated tetrahedron',
	cuboctahedron: 'Cuboctahedron',
	truncatedCube: 'Truncated cube',
	truncatedOctahedron: 'Truncated octahedron',
	rhombicuboctahedron: 'Rhombicuboctahedron',
	snubCube: 'Snub cube',
	icosidodecahedron: 'Icosidodecahedron'
};
