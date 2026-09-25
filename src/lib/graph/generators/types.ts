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
	'desargues',
	'frucht',
	'herschel',
	'chvatal',
	'pappus',
	'coxeter',
	'tutteCoxeter',
	'clebsch',
	'dyck',
	'goldnerHarary',
	'paley',
	'sierpinskiGasket',
	'sierpinskiTetrahedron',
	'cell24',
	'stella',
	'rhombicDodecahedron',
	'csaszar',
	'szilassi'
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

const NAMED_GRAPH_SET = new Set<string>(NAMED_GRAPHS);

/** True when `id` is a catalog named graph rather than a procedural kind. */
export function isNamedGraphId(id: string): id is NamedGraphId {
	return NAMED_GRAPH_SET.has(id);
}

/** Type-dropdown ids: procedural kinds plus each catalog named graph. */
export type GeneratePickerId = Exclude<GraphKind, 'named'> | NamedGraphId;

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
	/** Flatten onto the XZ plane (2D drawing). UI only offers this for prism, hypercube, and Goldner–Harary. */
	planar?: boolean;
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
	'knn',
	'cubicLattice',
	'unitBall',
	'spherical'
]);

export function fieldsForKind(kind: GraphKind | NamedGraphId): readonly KindField[] {
	if (isNamedGraphId(kind)) {
		if (kind === 'paley') return ['paleyQ'];
		if (kind === 'sierpinskiGasket' || kind === 'sierpinskiTetrahedron') return ['sierpinskiDepth'];
		return [];
	}
	return KIND_FIELDS[kind];
}

/** Inclusive bounds the generator enforces for a Generate number field. */
export type FieldLimit = { min: number; max?: number };

const NODE_MIN: Partial<Record<GraphKind, number>> = {
	null: 0,
	complete: 1,
	simple: 2,
	multi: 2,
	communities: 2,
	regular: 2,
	tournament: 2,
	dag: 2,
	knn: 2,
	unitBall: 2,
	spherical: 2,
	scaleFree: 3,
	cycle: 3,
	circulant: 3,
	helix: 3,
	smallWorld: 4,
	wheel: 4,
	delaunay3: 4
};

function counted(n: number | undefined, min: number): number {
	const v = Number(n);
	if (!Number.isFinite(v)) return min;
	return Math.max(min, Math.round(v));
}

/**
 * Min and max for a Generate field. `max` is omitted when the generator has no ceiling.
 * Node-dependent ceilings use the count the generator would actually keep.
 */
export function generateFieldLimit(
	kind: GeneratePickerId,
	field: KindField,
	ctx: { nodes?: number; petersenN?: number } = {}
): FieldLimit | undefined {
	if (field === 'sierpinskiDepth') return { min: 0 };
	if (isNamedGraphId(kind)) return undefined;
	switch (field) {
		case 'nodes': {
			const min = NODE_MIN[kind];
			return min === undefined ? undefined : { min };
		}
		case 'density':
		case 'pInside':
		case 'pBetween':
		case 'rewire':
			return { min: 0, max: 1 };
		case 'extraEdges':
			return { min: 0 };
		case 'degree': {
			const nodes = counted(ctx.nodes, NODE_MIN.regular ?? 2);
			return { min: 0, max: Math.max(0, nodes - 1) };
		}
		case 'depth':
			return { min: 1 };
		case 'branching':
			return { min: 2 };
		case 'left':
		case 'right':
			return { min: 1 };
		case 'attachments': {
			const nodes = counted(ctx.nodes, NODE_MIN.scaleFree ?? 3);
			return { min: 1, max: Math.min(5, Math.max(1, nodes - 1)) };
		}
		case 'neighbors': {
			if (kind === 'smallWorld') {
				const nodes = counted(ctx.nodes, NODE_MIN.smallWorld ?? 4);
				return { min: 2, max: Math.max(2, nodes - 2) };
			}
			const nodes = counted(ctx.nodes, NODE_MIN.knn ?? 2);
			return { min: 1, max: Math.max(1, nodes - 1) };
		}
		case 'rungs':
		case 'petersenN':
			return { min: 3, max: 20 };
		case 'rings':
		case 'segments':
			return { min: 3 };
		case 'rows':
		case 'columns':
		case 'layers':
			return { min: 1 };
		case 'radius':
			return { min: 0.2 };
		case 'groups':
			return { min: 2, max: counted(ctx.nodes, NODE_MIN.communities ?? 2) };
		case 'nGons':
			return kind === 'prism' ? { min: 3, max: 20 } : { min: 3 };
		case 'dimension':
			return { min: 2 };
		case 'extent':
			return { min: 1 };
		case 'turns':
			return { min: 0.5 };
		case 'chord': {
			const nodes = counted(ctx.nodes, NODE_MIN.helix ?? 3);
			return { min: 0, max: Math.max(0, nodes - 1) };
		}
		case 'petersenK': {
			const pn = counted(ctx.petersenN, 3);
			return { min: 1, max: Math.max(1, Math.floor(pn / 2) - (pn % 2 === 0 ? 1 : 0)) };
		}
		default:
			return undefined;
	}
}

export function kindAllowsWeighted(kind: GraphKind | NamedGraphId): boolean {
	if (isNamedGraphId(kind)) return false;
	return SHARED_WEIGHTED.has(kind);
}

export function kindAllowsDirected(kind: GraphKind | NamedGraphId): boolean {
	if (isNamedGraphId(kind)) return false;
	return SHARED_DIRECTED.has(kind);
}

const PLANAR_PICKER_IDS: ReadonlySet<GraphKind | NamedGraphId> = new Set([
	'prism',
	'hypercube',
	'goldnerHarary'
]);

/** True when Generate can offer a 2D drawing — kinds that actually leave the XZ plane. */
export function kindAllowsPlanar(kind: GraphKind | NamedGraphId): boolean {
	return PLANAR_PICKER_IDS.has(kind);
}

/** Last Generate-tool form values. Survives ManagerPanel remounts in session state. */
export interface GenerateFormState {
	kind: GeneratePickerId;
	nodes: number;
	density: number;
	extraEdges: number;
	loops: boolean;
	directed: boolean;
	weighted: boolean;
	degree: number;
	transitive: boolean;
	named: NamedGraphId;
	paleyQ: number;
	sierpinskiDepth: number;
	depth: number;
	binary: boolean;
	branching: number;
	left: number;
	right: number;
	attachments: number;
	neighbors: number;
	rewire: number;
	jumps: string;
	rungs: number;
	fan: boolean;
	rows: number;
	columns: number;
	layers: number;
	diagonals: boolean;
	radius: number;
	groups: number;
	pInside: number;
	pBetween: number;
	nGons: number;
	dimension: number;
	platonic: PlatonicSolid;
	archimedean: ArchimedeanSolid;
	extent: number;
	turns: number;
	chord: number;
	rings: number;
	segments: number;
	petersenN: number;
	petersenK: number;
	planar: boolean;
}

export function defaultGenerateForm(): GenerateFormState {
	return {
		kind: 'simple',
		nodes: 12,
		density: 0.25,
		extraEdges: 12,
		loops: false,
		directed: false,
		weighted: false,
		degree: 3,
		transitive: false,
		named: 'petersen',
		paleyQ: 13,
		sierpinskiDepth: 2,
		depth: 3,
		binary: true,
		branching: 3,
		left: 5,
		right: 5,
		attachments: 2,
		neighbors: 4,
		rewire: 0.1,
		jumps: '1',
		rungs: 6,
		fan: false,
		rows: 4,
		columns: 4,
		layers: 3,
		diagonals: false,
		radius: 3,
		groups: 3,
		pInside: 0.55,
		pBetween: 0.08,
		nGons: 6,
		dimension: 3,
		platonic: 'tetrahedron',
		archimedean: 'cuboctahedron',
		extent: 2,
		turns: 2,
		chord: 0,
		rings: 4,
		segments: 8,
		petersenN: 5,
		petersenK: 2,
		planar: false
	};
}

export function parseJumpList(text: string): number[] {
	return text
		.split(/[, ]+/)
		.map((part) => Number(part))
		.filter((n) => Number.isFinite(n) && n > 0);
}

export function generateOptionsFromForm(form: GenerateFormState): GenerateOptions {
	return {
		nodes: form.nodes,
		density: form.density,
		extraEdges: form.extraEdges,
		loops: form.loops,
		directed: kindAllowsDirected(form.kind) ? form.directed : false,
		weighted: kindAllowsWeighted(form.kind) ? form.weighted : false,
		degree: form.degree,
		transitive: form.transitive,
		named: form.named,
		paleyQ: form.paleyQ,
		sierpinskiDepth: form.sierpinskiDepth,
		depth: form.depth,
		binary: form.binary,
		branching: form.branching,
		left: form.left,
		right: form.right,
		attachments: form.attachments,
		neighbors: form.neighbors,
		rewire: form.rewire,
		jumps: parseJumpList(form.jumps),
		rungs: form.rungs,
		fan: form.fan,
		rows: form.rows,
		columns: form.columns,
		layers: form.layers,
		diagonals: form.diagonals,
		radius: form.radius,
		groups: form.groups,
		pInside: form.pInside,
		pBetween: form.pBetween,
		nGons: form.nGons,
		dimension: form.dimension,
		platonic: form.platonic,
		archimedean: form.archimedean,
		extent: form.extent,
		turns: form.turns,
		chord: form.chord,
		rings: form.rings,
		segments: form.segments,
		petersenN: form.petersenN,
		petersenK: form.petersenK,
		planar: kindAllowsPlanar(form.kind) ? form.planar : false
	};
}

/** Map the Generate picker onto {@link generateGraph} kind + options. */
export function generateRequestFromForm(form: GenerateFormState): {
	kind: GraphKind;
	options: GenerateOptions;
} {
	const options = generateOptionsFromForm(form);
	if (isNamedGraphId(form.kind)) {
		return { kind: 'named', options: { ...options, named: form.kind } };
	}
	return { kind: form.kind, options };
}

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

export const GRAPH_KIND_GROUPS: {
	label: string;
	kinds: { id: GeneratePickerId; label: string }[];
}[] = [
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
	},
	{
		label: 'Named',
		kinds: [
			{ id: 'petersen', label: NAMED_GRAPH_LABELS.petersen },
			{ id: 'generalizedPetersen', label: 'Generalized Petersen' },
			{ id: 'heawood', label: NAMED_GRAPH_LABELS.heawood },
			{ id: 'grotzsch', label: NAMED_GRAPH_LABELS.grotzsch },
			{ id: 'wagner', label: NAMED_GRAPH_LABELS.wagner },
			{ id: 'desargues', label: NAMED_GRAPH_LABELS.desargues },
			{ id: 'frucht', label: NAMED_GRAPH_LABELS.frucht },
			{ id: 'herschel', label: NAMED_GRAPH_LABELS.herschel },
			{ id: 'chvatal', label: NAMED_GRAPH_LABELS.chvatal },
			{ id: 'pappus', label: NAMED_GRAPH_LABELS.pappus },
			{ id: 'coxeter', label: NAMED_GRAPH_LABELS.coxeter },
			{ id: 'tutteCoxeter', label: NAMED_GRAPH_LABELS.tutteCoxeter },
			{ id: 'clebsch', label: NAMED_GRAPH_LABELS.clebsch },
			{ id: 'dyck', label: NAMED_GRAPH_LABELS.dyck },
			{ id: 'goldnerHarary', label: NAMED_GRAPH_LABELS.goldnerHarary },
			{ id: 'paley', label: NAMED_GRAPH_LABELS.paley },
			{ id: 'sierpinskiGasket', label: NAMED_GRAPH_LABELS.sierpinskiGasket },
			{ id: 'sierpinskiTetrahedron', label: NAMED_GRAPH_LABELS.sierpinskiTetrahedron },
			{ id: 'cell24', label: NAMED_GRAPH_LABELS.cell24 },
			{ id: 'stella', label: NAMED_GRAPH_LABELS.stella },
			{ id: 'rhombicDodecahedron', label: NAMED_GRAPH_LABELS.rhombicDodecahedron },
			{ id: 'csaszar', label: NAMED_GRAPH_LABELS.csaszar },
			{ id: 'szilassi', label: NAMED_GRAPH_LABELS.szilassi }
		]
	}
];

/** One-line Generate helper for the selected type. */
export const GRAPH_KIND_HELP: Record<GeneratePickerId, string> = {
	null: 'Nodes only — no edges.',
	simple: 'Random edges between distinct pairs. Density is how many of the possible pairs you get.',
	multi: 'Random extra edges; the same pair can appear more than once, and loops are optional.',
	scaleFree: 'Preferential attachment: a few hubs collect most of the links.',
	communities: 'Clusters with more edges inside each group than between groups.',
	cycle: 'One loop that visits every node and returns to the start.',
	wheel: 'A cycle plus a hub joined to every node on the rim.',
	regular: 'Every node has the same number of neighbors (the degree you set).',
	complete: 'Every pair of nodes is connected.',
	tournament: 'A directed complete graph: one way between every pair.',
	smallWorld: 'A ring of nearby neighbors, then a few random rewires.',
	circulant: 'A cycle plus extra chords at the jump lengths you list.',
	prism: 'Two matching polygons with corresponding corners joined.',
	mobiusLadder: 'A circular ladder with a half-twist.',
	hypercube: 'The n-dimensional cube graph (Q3 is the ordinary cube).',
	tree: 'Connected and acyclic — unique path between any two nodes.',
	dag: 'Directed acyclic graph; edges only run forward in a random order.',
	bipartite: 'Two parts; edges only go from left to right.',
	grid: 'A rectangular lattice on the floor.',
	hexGrid: 'A honeycomb lattice.',
	knn: 'Each node joins its k nearest neighbors.',
	platonic: 'The graph of a Platonic solid — tetrahedron through icosahedron.',
	archimedean: 'The graph of an Archimedean (truncated or snub) solid.',
	antiprism: 'Two polygons, rotated, with triangular sides between them.',
	pyramid: 'An apex over a polygonal base.',
	cubicLattice: 'A 3D grid of cubes.',
	diamondLattice: 'The carbon-diamond crystal graph.',
	unitBall: 'Random points in a ball; join a pair if they are close enough.',
	spherical: 'Random points on a sphere; join a pair if they are close enough.',
	delaunay3: 'Tetrahedral mesh of a random 3D point cloud.',
	helix: 'Points along a helix, consecutive plus optional chords.',
	torusGrid: 'A grid wrapped into a doughnut.',
	generalizedPetersen: 'Outer cycle, inner star, and spokes — G(n,k).',
	petersen: 'The famous 10-vertex non-Hamiltonian graph.',
	heawood: '14-vertex cage; the map graph of the torus.',
	grotzsch: 'Smallest triangle-free graph that needs four colors.',
	wagner: 'Möbius ladder on eight vertices.',
	frucht: 'Smallest cubic graph with no symmetries.',
	herschel: 'Smallest non-Hamiltonian polyhedral graph.',
	desargues: '20-vertex incidence graph of the Desargues configuration.',
	pappus: '18-vertex incidence graph of the Pappus configuration.',
	chvatal: '12-vertex regular triangle-free graph.',
	coxeter: '28-vertex cubic cage.',
	tutteCoxeter: '30-vertex cubic cage (Tutte 8-cage).',
	clebsch: '16-vertex strongly regular graph.',
	dyck: '32-vertex cubic symmetric graph.',
	goldnerHarary: 'Smallest non-Hamiltonian maximal planar graph.',
	paley: 'Paley graph from a finite field of order q.',
	sierpinskiGasket: 'Recursive triangle fractal.',
	cell24: 'Skeleton of the 24-cell, a regular 4-polytope.',
	csaszar: 'Polyhedral graph in which every pair of vertices is joined.',
	szilassi: 'Dual of the Császár; every pair of faces shares an edge.',
	stella: 'Two tetrahedra interpenetrating (stella octangula).',
	rhombicDodecahedron: 'Catalan solid with 14 vertices.',
	sierpinskiTetrahedron: 'Recursive tetrahedron fractal.'
};

/** Helper copy for the Generate type dropdown. */
export function kindHelp(kind: GeneratePickerId): string {
	return GRAPH_KIND_HELP[kind];
}

/** Shared note for every 0–1 field that steps by 0.01. */
export const PROBABILITY_RANGE_HELP = 'From 0 to 1, step 0.01.';

/** Generate helper under Communities p inside. */
export const COMMUNITY_P_INSIDE_HELP = `Chance two nodes in the same group get an edge. ${PROBABILITY_RANGE_HELP}`;

/** Generate helper under Communities p between. */
export const COMMUNITY_P_BETWEEN_HELP = `Chance two nodes in different groups get an edge. ${PROBABILITY_RANGE_HELP}`;

/** Generate helper under Density. */
export const DENSITY_FIELD_HELP = `Share of the possible pairs that get an edge. ${PROBABILITY_RANGE_HELP}`;

/** Generate helper under Small-world Rewire. */
export const REWIRE_FIELD_HELP = `Chance each nearby edge is swapped for a random one. ${PROBABILITY_RANGE_HELP}`;

/** Generate helper under Scale-free Attachments. */
export const ATTACHMENTS_FIELD_HELP =
	'How many links each new node grows toward existing hubs. From 1 up to the smaller of 5 and nodes − 1.';

/** Generate helper under Regular Degree. */
export const DEGREE_FIELD_HELP = 'Neighbors per node. From 0 to nodes − 1.';

/** Generate helper under Small-world Neighbors. */
export const NEIGHBORS_FIELD_HELP =
	'Nearby ring neighbors before any rewire. From 2 to nodes − 2 (kept even).';

/** Generate helper under Möbius ladder Rungs. */
export const RUNGS_FIELD_HELP = 'Rungs around the circular ladder. From 3 to 20.';

/** Generate helper under Hypercube Dimension. */
export const DIMENSION_FIELD_HELP = 'Dimension n of the hypercube Qₙ. At least 2.';

/** Generate helper under Tree Branching. */
export const BRANCHING_FIELD_HELP = 'Children per node when Binary is off. At least 2.';

/** Generate helper under Tree Depth. */
export const DEPTH_FIELD_HELP = 'How many steps from the root to the deepest leaf. At least 1.';

/** Generate helper under Diamond Extent. */
export const EXTENT_FIELD_HELP = 'How far the diamond lattice grows from the origin. At least 1.';

/** Generate helper under Helix Turns. */
export const TURNS_FIELD_HELP = 'How many full twists the helix makes. At least 0.5, step 0.5.';

/** Generate helper under Helix Chord. */
export const CHORD_FIELD_HELP =
	'Extra edges that skip this many steps along the helix. From 0 to nodes − 1.';

/** Generate helper under Torus Rings. */
export const RINGS_FIELD_HELP = 'Loops around the doughnut hole. At least 3.';

/** Generate helper under Torus Segments. */
export const SEGMENTS_FIELD_HELP = 'Points around each ring tube. At least 3.';

/** Generate helper under Circulant jumps. */
export const JUMPS_FIELD_HELP = 'Each jump is an integer from 1 up to half the nodes.';

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
