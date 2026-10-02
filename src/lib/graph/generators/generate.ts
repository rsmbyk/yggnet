import { edgeCount, nodeCount } from '../model/document';
import type { GraphDocument } from '../model/types';
import { assemble, clampInt, clampNodes, directed, undirected, type EdgeSpec } from './build';
import { delaunayEdges3 } from './delaunay';
import {
	dist,
	dist2,
	enforceMinDistance,
	GENERATE_MIN_DISTANCE,
	projectToPlane,
	rotateY,
	tumble,
	uniquePairs,
	vec,
	type Vec3
} from './geom';
import { generalizedPetersen, namedSpec } from './named';
import { antiprismSpec, archimedeanSpec, platonicSpec, pyramidSpec } from './polyhedra';
import { createRng, randomSeed, type Rng } from './rng';
import { type GenerateOptions, type GraphKind } from './types';

export {
	ARCHIMEDEAN_LABELS,
	ARCHIMEDEAN_SOLIDS,
	COMMUNITY_P_BETWEEN_HELP,
	COMMUNITY_P_INSIDE_HELP,
	DENSITY_FIELD_HELP,
	ATTACHMENTS_FIELD_HELP,
	DEGREE_FIELD_HELP,
	NEIGHBORS_FIELD_HELP,
	RUNGS_FIELD_HELP,
	DIMENSION_FIELD_HELP,
	BRANCHING_FIELD_HELP,
	DEPTH_FIELD_HELP,
	EXTENT_FIELD_HELP,
	TURNS_FIELD_HELP,
	CHORD_FIELD_HELP,
	RINGS_FIELD_HELP,
	SEGMENTS_FIELD_HELP,
	defaultGenerateForm,
	fieldsForKind,
	generateFieldLimit,
	generateOptionsFromForm,
	generateRequestFromForm,
	GRAPH_KIND_GROUPS,
	GRAPH_KINDS,
	isNamedGraphId,
	JUMPS_FIELD_HELP,
	kindAllowsDirected,
	kindAllowsPlanar,
	kindAllowsWeighted,
	kindHelp,
	NAMED_GRAPH_LABELS,
	NAMED_GRAPHS,
	PALEY_ORDERS,
	parseJumpList,
	PLATONIC_LABELS,
	PLATONIC_SOLIDS,
	PROBABILITY_RANGE_HELP,
	REWIRE_FIELD_HELP
} from './types';
export type {
	ArchimedeanSolid,
	GenerateFormState,
	GenerateOptions,
	GeneratePickerId,
	GraphKind,
	KindField,
	NamedGraphId,
	PlatonicSolid
} from './types';
export { GENERATE_MIN_DISTANCE, enforceMinDistance } from './geom';
export { randomSeed };

function circleLayout(n: number, radius: number, y = 0): Vec3[] {
	return Array.from({ length: n }, (_, i) => {
		const t = (i / n) * Math.PI * 2;
		return vec(Math.cos(t) * radius, y, Math.sin(t) * radius);
	});
}

function centroid(points: Vec3[]): Vec3 {
	const n = points.length || 1;
	let x = 0;
	let y = 0;
	let z = 0;
	for (const p of points) {
		x += p.x;
		y += p.y;
		z += p.z;
	}
	return vec(x / n, y / n, z / n);
}

/** Regular polygon, packed, recentered — the same settling Simple uses. */
function layoutLikeSimple(count: number): Vec3[] {
	if (count <= 0) return [];
	if (count === 1) return [vec(0, 0, 0)];
	const packed = enforceMinDistance(circleLayout(count, 5), GENERATE_MIN_DISTANCE, true);
	const c = centroid(packed);
	return packed.map((p) => vec(p.x - c.x, p.y - c.y, p.z - c.z));
}

/**
 * Place each community as a mini Simple graph, then sit group centers on a
 * ring so adjacent bounding circles are 3R apart (R = fattest group radius).
 */
function communityPoints(n: number, groupCount: number, assigned: number[]): Vec3[] {
	const members: number[][] = Array.from({ length: groupCount }, () => []);
	for (let i = 0; i < n; i += 1) members[assigned[i]].push(i);
	const local = members.map((ids) => layoutLikeSimple(ids.length));
	let R = 0;
	for (const pts of local) {
		for (const p of pts) R = Math.max(R, Math.hypot(p.x, p.y, p.z));
	}
	if (R < 1e-9) R = GENERATE_MIN_DISTANCE;
	const rho = (3 * R) / (2 * Math.sin(Math.PI / groupCount));
	const points: Vec3[] = Array.from({ length: n }, () => vec(0, 0, 0));
	for (let k = 0; k < groupCount; k += 1) {
		const t = (k / groupCount) * Math.PI * 2;
		const cx = Math.cos(t) * rho;
		const cz = Math.sin(t) * rho;
		const pts = local[k];
		const ids = members[k];
		for (let j = 0; j < ids.length; j += 1) {
			points[ids[j]] = vec(pts[j].x + cx, pts[j].y, pts[j].z + cz);
		}
	}
	return points;
}

function applyYaw(points: Vec3[], yaw: number): Vec3[] {
	return points.map((p) => rotateY(p, yaw));
}

function applyTumble(points: Vec3[], rng: Rng, extra: boolean): Vec3[] {
	const yaw = rng.next() * Math.PI * 2;
	if (!extra) return applyYaw(points, yaw);
	const pitch = (rng.next() - 0.5) * Math.PI;
	const roll = (rng.next() - 0.5) * Math.PI;
	return points.map((p) => tumble(p, yaw, pitch, roll));
}

/**
 * Raise a 3D cloud so sphere bottoms clear the ground after `assemble` adds `nodeY`.
 * Assumes unit-ish node radius of 1 (matches world default).
 */
function liftOffFloor(points: Vec3[], nodeY: number, radius = 1, gap = 1): Vec3[] {
	if (points.length === 0) return points;
	let minY = Infinity;
	for (const p of points) minY = Math.min(minY, p.y);
	const targetMin = gap + radius - nodeY;
	const dy = targetMin - minY;
	if (!(dy > 1e-9)) return points;
	return points.map((p) => vec(p.x, p.y + dy, p.z));
}

function scatterDisk(n: number, radius: number, rng: Rng): Vec3[] {
	const pts: Vec3[] = [];
	for (let i = 0; i < n; i += 1) {
		const a = rng.next() * Math.PI * 2;
		const r = radius * Math.sqrt(rng.next());
		pts.push(vec(Math.cos(a) * r, 0, Math.sin(a) * r));
	}
	return pts;
}

function scatterBall(n: number, radius: number, rng: Rng): Vec3[] {
	const pts: Vec3[] = [];
	for (let i = 0; i < n; i += 1) {
		let x = 0;
		let y = 0;
		let z = 0;
		let s = 2;
		while (s > 1) {
			x = rng.next() * 2 - 1;
			y = rng.next() * 2 - 1;
			z = rng.next() * 2 - 1;
			s = x * x + y * y + z * z;
		}
		const r = radius * Math.cbrt(rng.next());
		const nrm = Math.sqrt(s) || 1;
		pts.push(vec((x / nrm) * r, (y / nrm) * r, (z / nrm) * r));
	}
	return pts;
}

function scatterSphere(n: number, radius: number, rng: Rng): Vec3[] {
	const pts: Vec3[] = [];
	for (let i = 0; i < n; i += 1) {
		const u = rng.next();
		const v = rng.next();
		const theta = 2 * Math.PI * u;
		const phi = Math.acos(2 * v - 1);
		pts.push(
			vec(
				radius * Math.sin(phi) * Math.cos(theta),
				radius * Math.cos(phi),
				radius * Math.sin(phi) * Math.sin(theta)
			)
		);
	}
	return pts;
}

function geometricEdges(points: Vec3[], radius: number): [number, number][] {
	const r2 = radius * radius;
	const edges: [number, number][] = [];
	for (let i = 0; i < points.length; i += 1) {
		for (let j = i + 1; j < points.length; j += 1) {
			if (dist2(points[i], points[j]) <= r2 + 1e-9) edges.push([i, j]);
		}
	}
	return edges;
}

function knnEdges(points: Vec3[], k: number): [number, number][] {
	const n = points.length;
	const kk = Math.max(1, Math.min(k, n - 1));
	const pairs: [number, number][] = [];
	for (let i = 0; i < n; i += 1) {
		const distI = points
			.map((p, j) => ({ j, d: dist2(points[i], p) }))
			.filter((x) => x.j !== i)
			.sort((a, b) => a.d - b.d)
			.slice(0, kk);
		for (const x of distI) pairs.push([i, x.j]);
	}
	return uniquePairs(pairs);
}

function maybeOrient(edges: EdgeSpec[], directed: boolean, rng: Rng): EdgeSpec[] {
	if (!directed) return edges.map((e) => ({ ...e, directed: e.directed === true }));
	return edges.map((e) => {
		if (e.directed) return e;
		if (rng.chance(0.5)) return { from: e.to, to: e.from, directed: true };
		return { ...e, directed: true };
	});
}

/** `density` fraction of `pairs`, rounded; which pairs is a uniform random subset. */
function pickByDensity<T>(pairs: T[], density: number, rng: Rng): T[] {
	const p = Math.min(1, Math.max(0, density));
	const m = Math.round(p * pairs.length);
	if (m <= 0) return [];
	if (m >= pairs.length) return pairs;
	return rng.shuffle(pairs).slice(0, m);
}

function finish(
	title: string,
	points: Vec3[],
	edges: EdgeSpec[],
	rng: Rng,
	opts: GenerateOptions,
	layout: 'yaw' | 'tumble' | 'grid90' | 'hex60' | 'none'
): GraphDocument {
	let pts = points;
	let layoutMode = layout;
	if (opts.planar && layoutMode === 'tumble') layoutMode = 'yaw';
	if (layoutMode === 'grid90') pts = applyYaw(pts, rng.int(0, 3) * (Math.PI / 2));
	else if (layoutMode === 'hex60') pts = applyYaw(pts, rng.int(0, 5) * (Math.PI / 3));
	else if (layoutMode === 'yaw') pts = applyTumble(pts, rng, false);
	else if (layoutMode === 'tumble') pts = applyTumble(pts, rng, true);
	if (opts.planar) pts = projectToPlane(pts);
	const packPlanar =
		opts.planar === true ||
		layoutMode === 'yaw' ||
		layoutMode === 'grid90' ||
		layoutMode === 'hex60' ||
		pts.every((p) => Math.abs(p.y) < 1e-6);
	pts = enforceMinDistance(pts, undefined, packPlanar);
	const flat = pts.every((p) => Math.abs(p.y) < 1e-6);
	if (!flat) pts = liftOffFloor(pts, opts.nodeY ?? 0);
	const oriented = maybeOrient(edges, opts.directed === true, rng);
	return assemble(title, pts, oriented, rng, {
		nodeY: opts.nodeY ?? 0,
		weighted: opts.weighted === true,
		directed: false
	});
}

function snapRegular(n: number, k: number): { n: number; k: number } {
	let nodes = clampNodes(n, 2);
	let deg = clampInt(k, 0, nodes - 1);
	if ((nodes * deg) % 2 === 1) {
		if (deg > 0) deg -= 1;
		else nodes = nodes % 2 === 0 ? nodes : Math.max(2, nodes - 1);
	}
	return { n: nodes, k: deg };
}

function configurationRegular(n: number, k: number, rng: Rng): [number, number][] {
	if (k <= 0) return [];
	for (let attempt = 0; attempt < 40; attempt += 1) {
		const stubs: number[] = [];
		for (let i = 0; i < n; i += 1) {
			for (let t = 0; t < k; t += 1) stubs.push(i);
		}
		const sh = rng.shuffle(stubs);
		const edges: [number, number][] = [];
		let ok = true;
		const seen = new Set<string>();
		for (let i = 0; i + 1 < sh.length; i += 2) {
			const a = sh[i];
			const b = sh[i + 1];
			if (a === b) {
				ok = false;
				break;
			}
			const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
			if (seen.has(key)) {
				ok = false;
				break;
			}
			seen.add(key);
			edges.push([a, b]);
		}
		if (ok) return edges;
	}
	const edges: [number, number][] = [];
	const half = Math.floor(k / 2);
	for (let i = 0; i < n; i += 1) {
		for (let j = 1; j <= half; j += 1) edges.push([i, (i + j) % n]);
	}
	if (k % 2 === 1 && n % 2 === 0) {
		for (let i = 0; i < n / 2; i += 1) edges.push([i, i + n / 2]);
	}
	return uniquePairs(edges);
}

function randomTree(
	depth: number,
	binary: boolean,
	branching: number,
	rng: Rng
): {
	points: Vec3[];
	edges: [number, number][];
} {
	const maxD = Math.max(1, Math.round(depth));
	const branch = binary ? 2 : Math.max(2, Math.round(branching));
	const parent: number[] = [-1];
	const depths: number[] = [0];
	const kids: number[] = [0];
	const want = Math.max(1, Math.round(1 + (branch ** (maxD + 1) - 1) / Math.max(branch - 1, 1)));
	while (parent.length < want) {
		const candidates = parent.map((_, i) => i).filter((i) => depths[i] < maxD && kids[i] < branch);
		if (candidates.length === 0) break;
		const p = rng.pick(candidates);
		parent.push(p);
		depths.push(depths[p] + 1);
		kids.push(0);
		kids[p] += 1;
	}
	if (!depths.some((d) => d === maxD)) {
		let p = 0;
		while (depths[p] < maxD) {
			const cur = parent.length;
			parent.push(p);
			depths.push(depths[p] + 1);
			kids.push(0);
			kids[p] += 1;
			p = cur;
		}
	}
	const n = parent.length;
	const children: number[][] = Array.from({ length: n }, () => []);
	for (let i = 1; i < n; i += 1) children[parent[i]].push(i);
	const xOf = Array.from({ length: n }, () => 0);
	let nextLeafX = 0;
	const gap = 2.6;
	const depthGap = 4;
	const place = (id: number) => {
		const kidsOf = children[id];
		if (kidsOf.length === 0) {
			xOf[id] = nextLeafX;
			nextLeafX += gap;
			return;
		}
		for (const c of kidsOf) place(c);
		xOf[id] = (xOf[kidsOf[0]] + xOf[kidsOf[kidsOf.length - 1]]) / 2;
	};
	place(0);
	const mid = xOf[0];
	const points: Vec3[] = Array.from({ length: n }, (_, i) =>
		vec(xOf[i] - mid, 0, depths[i] * depthGap)
	);
	const edges: [number, number][] = [];
	for (let i = 1; i < n; i += 1) edges.push([parent[i], i]);
	return { points, edges };
}

function baGraph(n: number, m: number, rng: Rng): [number, number][] {
	const nodes = clampNodes(n, 3);
	const attach = clampInt(m, 1, Math.min(5, nodes - 1));
	const edges: [number, number][] = [];
	const degree = Array.from({ length: nodes }, () => 0);
	const start = attach + 1;
	for (let i = 0; i < start; i += 1) {
		for (let j = i + 1; j < start; j += 1) {
			edges.push([i, j]);
			degree[i] += 1;
			degree[j] += 1;
		}
	}
	for (let v = start; v < nodes; v += 1) {
		const targets = new Set<number>();
		let guard = 0;
		while (targets.size < attach && guard < 200) {
			guard += 1;
			const total = degree.reduce((s, d) => s + d, 0) || v;
			let r = rng.next() * total;
			let pick = 0;
			for (let i = 0; i < v; i += 1) {
				r -= degree[i] || 1;
				if (r <= 0) {
					pick = i;
					break;
				}
				pick = i;
			}
			targets.add(pick);
		}
		for (const t of targets) {
			edges.push([v, t]);
			degree[v] += 1;
			degree[t] += 1;
		}
	}
	return uniquePairs(edges);
}

function wattsStrogatz(n: number, k: number, p: number, rng: Rng): [number, number][] {
	const nodes = clampNodes(n, 4);
	let deg = clampInt(k, 2, nodes - 2);
	if (deg % 2 === 1) deg -= 1;
	const half = deg / 2;
	const adj = Array.from({ length: nodes }, () => new Set<number>());
	for (let i = 0; i < nodes; i += 1) {
		for (let j = 1; j <= half; j += 1) {
			adj[i].add((i + j) % nodes);
			adj[(i + j) % nodes].add(i);
		}
	}
	for (let i = 0; i < nodes; i += 1) {
		for (let j = 1; j <= half; j += 1) {
			const nbr = (i + j) % nodes;
			if (!rng.chance(p)) continue;
			adj[i].delete(nbr);
			adj[nbr].delete(i);
			let w = rng.int(0, nodes - 1);
			let tries = 0;
			while ((w === i || adj[i].has(w)) && tries < nodes) {
				w = (w + 1) % nodes;
				tries += 1;
			}
			if (w !== i) {
				adj[i].add(w);
				adj[w].add(i);
			} else {
				adj[i].add(nbr);
				adj[nbr].add(i);
			}
		}
	}
	const edges: [number, number][] = [];
	for (let i = 0; i < nodes; i += 1) {
		for (const j of adj[i]) {
			if (i < j) edges.push([i, j]);
		}
	}
	return edges;
}

function cartesianGrid(
	rows: number,
	cols: number,
	layers: number,
	diagonals: boolean
): { points: Vec3[]; edges: [number, number][] } {
	const r = Math.max(1, rows);
	const c = Math.max(1, cols);
	const l = Math.max(1, layers);
	const id = (x: number, y: number, z: number) => y * (c * l) + z * c + x;
	const points: Vec3[] = [];
	for (let y = 0; y < r; y += 1) {
		for (let z = 0; z < l; z += 1) {
			for (let x = 0; x < c; x += 1) {
				points.push(vec((x - (c - 1) / 2) * 2.4, (y - (r - 1) / 2) * 2.4, (z - (l - 1) / 2) * 2.4));
			}
		}
	}
	const edges: [number, number][] = [];
	const inb = (x: number, y: number, z: number) =>
		x >= 0 && x < c && y >= 0 && y < r && z >= 0 && z < l;
	for (let y = 0; y < r; y += 1) {
		for (let z = 0; z < l; z += 1) {
			for (let x = 0; x < c; x += 1) {
				const a = id(x, y, z);
				const dirs: [number, number, number][] = [
					[1, 0, 0],
					[0, 1, 0],
					[0, 0, 1]
				];
				if (diagonals) {
					for (const dx of [-1, 0, 1]) {
						for (const dy of [-1, 0, 1]) {
							for (const dz of [-1, 0, 1]) {
								if (dx === 0 && dy === 0 && dz === 0) continue;
								if (dx < 0 || (dx === 0 && dy < 0) || (dx === 0 && dy === 0 && dz <= 0)) continue;
								dirs.push([dx, dy, dz]);
							}
						}
					}
				}
				for (const [dx, dy, dz] of dirs) {
					const nx = x + dx;
					const ny = y + dy;
					const nz = z + dz;
					if (inb(nx, ny, nz)) edges.push([a, id(nx, ny, nz)]);
				}
			}
		}
	}
	return { points, edges: uniquePairs(edges) };
}

function hexGrid(rows: number, cols: number): { points: Vec3[]; edges: [number, number][] } {
	const r = Math.max(1, rows);
	const c = Math.max(1, cols);
	const points: Vec3[] = [];
	const id = (row: number, col: number) => row * c + col;
	for (let row = 0; row < r; row += 1) {
		for (let col = 0; col < c; col += 1) {
			const x = (col + (row % 2) * 0.5) * 2.4;
			const z = -row * 2.08;
			points.push(vec(x - c * 1.2, 0, z + r));
		}
	}
	const edges: [number, number][] = [];
	const inb = (row: number, col: number) => row >= 0 && row < r && col >= 0 && col < c;
	for (let row = 0; row < r; row += 1) {
		for (let col = 0; col < c; col += 1) {
			const a = id(row, col);
			const odd = row % 2 === 1;
			const nbrs: [number, number][] = [
				[row, col + 1],
				[row + 1, col],
				[row + 1, odd ? col + 1 : col - 1]
			];
			for (const [nr, nc] of nbrs) {
				if (inb(nr, nc)) edges.push([a, id(nr, nc)]);
			}
		}
	}
	return { points, edges: uniquePairs(edges) };
}

function diamondLattice(extent: number): { points: Vec3[]; edges: [number, number][] } {
	const s = Math.max(1, Math.round(extent));
	const make = (size: number) => {
		const pts: Vec3[] = [];
		for (let i = 0; i < size; i += 1) {
			for (let j = 0; j < size; j += 1) {
				for (let k = 0; k < size; k += 1) {
					if ((i + j + k) % 2 !== 0) continue;
					pts.push(vec(i * 2, j * 2, k * 2));
					pts.push(vec(i * 2 + 0.7, j * 2 + 0.7, k * 2 + 0.7));
				}
			}
		}
		return pts;
	};
	const points = make(s);
	const edges: [number, number][] = [];
	const bond = 1.25;
	for (let i = 0; i < points.length; i += 1) {
		for (let j = i + 1; j < points.length; j += 1) {
			if (dist(points[i], points[j]) < bond) edges.push([i, j]);
		}
	}
	return { points, edges };
}

function hypercube(dim: number): { points: Vec3[]; edges: [number, number][] } {
	const d = Math.max(2, Math.round(dim));
	const n = 2 ** d;
	const points: Vec3[] = [];
	const edges: [number, number][] = [];
	for (let i = 0; i < n; i += 1) {
		const bits = Array.from({ length: d }, (_, b) => ((i >> b) & 1) * 2 - 1);
		const x = bits[0] * 2 + (bits[3] ?? 0) * 0.55;
		const y = bits[1] * 2 + (bits[4] ?? 0) * 0.55;
		const z = bits[2] * 2;
		points.push(vec(x, y, z));
		for (let b = 0; b < d; b += 1) {
			const j = i ^ (1 << b);
			if (i < j) edges.push([i, j]);
		}
	}
	return { points, edges };
}

type Built = {
	title: string;
	points: Vec3[];
	edges: EdgeSpec[];
	layout: 'yaw' | 'tumble' | 'grid90' | 'hex60' | 'none';
};

function buildKind(kind: GraphKind, opts: GenerateOptions, rng: Rng): Built {
	const n = clampNodes(opts.nodes ?? 12, kind === 'null' ? 0 : 2);
	const p = Math.min(1, Math.max(0, opts.density ?? 0.25));
	const directedFlag = opts.directed === true;

	switch (kind) {
		case 'null': {
			const count = clampNodes(opts.nodes ?? 8, 0);
			return {
				title: `Null ${count}`,
				points: circleLayout(count, 4.5),
				edges: [],
				layout: 'yaw'
			};
		}
		case 'simple': {
			if (directedFlag) {
				const pairs: [number, number][] = [];
				for (let i = 0; i < n; i += 1) {
					for (let j = 0; j < n; j += 1) {
						if (i !== j) pairs.push([i, j]);
					}
				}
				return {
					title: `Simple ${n}`,
					points: circleLayout(n, 5),
					edges: directed(pickByDensity(pairs, p, rng)),
					layout: 'yaw'
				};
			}
			const pairs: [number, number][] = [];
			for (let i = 0; i < n; i += 1) {
				for (let j = i + 1; j < n; j += 1) pairs.push([i, j]);
			}
			return {
				title: `Simple ${n}`,
				points: circleLayout(n, 5),
				edges: undirected(pickByDensity(pairs, p, rng)),
				layout: 'yaw'
			};
		}
		case 'multi': {
			const m = Math.max(0, Math.round(opts.extraEdges ?? 12));
			const loops = opts.loops === true;
			const edges: EdgeSpec[] = [];
			for (let i = 0; i < m; i += 1) {
				const a = rng.int(0, n - 1);
				let b = rng.int(0, n - 1);
				if (!loops && b === a) b = (a + 1) % n;
				edges.push({ from: a, to: b, directed: directedFlag });
			}
			return { title: `Multi ${n}`, points: circleLayout(n, 5), edges, layout: 'yaw' };
		}
		case 'scaleFree': {
			const edges = baGraph(n, opts.attachments ?? 2, rng);
			return {
				title: `Scale-free ${n}`,
				points: circleLayout(n, 5.5),
				edges: undirected(edges),
				layout: 'yaw'
			};
		}
		case 'communities': {
			const g = clampInt(opts.groups ?? 3, 2, n);
			const pin = Math.min(1, Math.max(0, opts.pInside ?? 0.55));
			const pout = Math.min(1, Math.max(0, opts.pBetween ?? 0.08));
			const assigned = rng.shuffle(Array.from({ length: n }, (_, i) => i % g));
			const edges: [number, number][] = [];
			for (let i = 0; i < n; i += 1) {
				for (let j = i + 1; j < n; j += 1) {
					const same = assigned[i] === assigned[j];
					if (rng.chance(same ? pin : pout)) edges.push([i, j]);
				}
			}
			return {
				title: `Communities ${n}`,
				points: communityPoints(n, g, assigned),
				edges: undirected(edges),
				layout: 'yaw'
			};
		}
		case 'cycle': {
			const c = clampNodes(opts.nodes ?? 8, 3);
			const edges: [number, number][] = [];
			for (let i = 0; i < c; i += 1) edges.push([i, (i + 1) % c]);
			return {
				title: `Cycle ${c}`,
				points: circleLayout(c, 5),
				edges: directedFlag ? directed(edges) : undirected(edges),
				layout: 'yaw'
			};
		}
		case 'wheel': {
			const c = clampNodes(opts.nodes ?? 8, 4);
			const edges: [number, number][] = [];
			for (let i = 1; i < c; i += 1) {
				edges.push([0, i]);
				edges.push([i, i === c - 1 ? 1 : i + 1]);
			}
			const points = [vec(0, 0, 0), ...circleLayout(c - 1, 5)];
			return { title: `Wheel ${c}`, points, edges: undirected(edges), layout: 'yaw' };
		}
		case 'regular': {
			const { n: rn, k } = snapRegular(opts.nodes ?? 12, opts.degree ?? 3);
			const edges = configurationRegular(rn, k, rng);
			return {
				title: `${k}-regular ${rn}`,
				points: circleLayout(rn, 5),
				edges: undirected(edges),
				layout: 'yaw'
			};
		}
		case 'complete': {
			const c = clampNodes(opts.nodes ?? 6, 1);
			const edges: EdgeSpec[] = [];
			for (let i = 0; i < c; i += 1) {
				for (let j = i + 1; j < c; j += 1) {
					if (directedFlag) {
						edges.push({ from: i, to: j, directed: true }, { from: j, to: i, directed: true });
					} else {
						edges.push({ from: i, to: j, directed: false });
					}
				}
			}
			return { title: `Complete ${c}`, points: circleLayout(c, 5), edges, layout: 'yaw' };
		}
		case 'tournament': {
			const c = clampNodes(opts.nodes ?? 8, 2);
			const perm = rng.shuffle([...Array(c).keys()]);
			const edges: EdgeSpec[] = [];
			for (let i = 0; i < c; i += 1) {
				for (let j = i + 1; j < c; j += 1) {
					if (opts.transitive) {
						edges.push({ from: perm[i], to: perm[j], directed: true });
					} else if (rng.chance(0.5)) {
						edges.push({ from: i, to: j, directed: true });
					} else {
						edges.push({ from: j, to: i, directed: true });
					}
				}
			}
			return { title: `Tournament ${c}`, points: circleLayout(c, 5), edges, layout: 'yaw' };
		}
		case 'smallWorld': {
			const edges = wattsStrogatz(n, opts.neighbors ?? 4, opts.rewire ?? 0.1, rng);
			return {
				title: `Small-world ${n}`,
				points: circleLayout(n, 5),
				edges: undirected(edges),
				layout: 'yaw'
			};
		}
		case 'circulant': {
			const c = clampNodes(opts.nodes ?? 12, 3);
			const jumps = (opts.jumps?.length ? opts.jumps : [1])
				.map((j) => clampInt(j, 1, Math.floor(c / 2)))
				.filter((j, i, arr) => arr.indexOf(j) === i);
			const edges: [number, number][] = [];
			for (let i = 0; i < c; i += 1) {
				for (const j of jumps) edges.push([i, (i + j) % c]);
			}
			return {
				title: `Circulant ${c}`,
				points: circleLayout(c, 5),
				edges: undirected(uniquePairs(edges)),
				layout: 'yaw'
			};
		}
		case 'prism': {
			const ng = clampInt(opts.nGons ?? 6, 3, 20);
			const points = opts.planar
				? [...circleLayout(ng, 5), ...circleLayout(ng, 2.8)]
				: [...circleLayout(ng, 5, 1.6), ...circleLayout(ng, 5, -1.6)];
			const edges: [number, number][] = [];
			for (let i = 0; i < ng; i += 1) {
				edges.push([i, (i + 1) % ng], [ng + i, ng + ((i + 1) % ng)], [i, ng + i]);
			}
			return {
				title: `Prism ${ng}`,
				points,
				edges: undirected(edges),
				layout: 'yaw'
			};
		}
		case 'mobiusLadder': {
			const rungs = clampInt(opts.rungs ?? 6, 3, 20);
			const v = rungs * 2;
			const points = circleLayout(v, 5);
			const edges: [number, number][] = [];
			for (let i = 0; i < v; i += 1) {
				edges.push([i, (i + 1) % v], [i, (i + rungs) % v]);
			}
			return {
				title: `Möbius ladder ${rungs}`,
				points,
				edges: undirected(uniquePairs(edges)),
				layout: 'yaw'
			};
		}
		case 'hypercube': {
			const g = hypercube(opts.dimension ?? 3);
			return {
				title: `Hypercube Q${Math.max(2, Math.round(opts.dimension ?? 3))}`,
				...g,
				edges: undirected(g.edges),
				layout: 'yaw'
			};
		}
		case 'named': {
			const spec = namedSpec(
				opts.named ?? 'petersen',
				opts.paleyQ ?? 13,
				opts.sierpinskiDepth ?? 2
			);
			return {
				title: spec.title,
				points: spec.points,
				edges: undirected(spec.edges),
				layout: 'yaw'
			};
		}
		case 'generalizedPetersen': {
			const pn = clampInt(opts.petersenN ?? 5, 3, 20);
			const pk = clampInt(
				opts.petersenK ?? 2,
				1,
				Math.max(1, Math.floor(pn / 2) - (pn % 2 === 0 ? 1 : 0))
			);
			const g = generalizedPetersen(pn, Math.min(pk, pn - 1));
			return {
				title: `G(${pn},${pk})`,
				points: g.points,
				edges: undirected(g.edges),
				layout: 'yaw'
			};
		}
		case 'tree': {
			const g = randomTree(opts.depth ?? 3, opts.binary !== false, opts.branching ?? 3, rng);
			return { title: 'Tree', points: g.points, edges: undirected(g.edges), layout: 'none' };
		}
		case 'dag': {
			const order = rng.shuffle([...Array(n).keys()]);
			const pairs: [number, number][] = [];
			for (let i = 0; i < n; i += 1) {
				for (let j = i + 1; j < n; j += 1) pairs.push([order[i], order[j]]);
			}
			const points: Vec3[] = Array.from({ length: n }, () => vec(0, 0, 0));
			order.forEach((v, idx) => {
				points[v] = vec((idx - (n - 1) / 2) * 1.6, 0, (rng.next() - 0.5) * 4);
			});
			return {
				title: `DAG ${n}`,
				points,
				edges: directed(pickByDensity(pairs, p, rng)),
				layout: 'none'
			};
		}
		case 'bipartite': {
			const left = clampNodes(opts.left ?? 5, 1);
			const right = clampNodes(opts.right ?? 5, 1);
			const points: Vec3[] = [];
			for (let i = 0; i < left; i += 1) points.push(vec(-4, 0, (i - (left - 1) / 2) * 2.2));
			for (let i = 0; i < right; i += 1) points.push(vec(4, 0, (i - (right - 1) / 2) * 2.2));
			const pairs: [number, number][] = [];
			for (let i = 0; i < left; i += 1) {
				for (let j = 0; j < right; j += 1) pairs.push([i, left + j]);
			}
			return {
				title: `Bipartite ${left}+${right}`,
				points,
				edges: undirected(pickByDensity(pairs, p, rng)),
				layout: 'none'
			};
		}
		case 'grid': {
			const rows = Math.max(1, Math.round(opts.rows ?? 4));
			const cols = Math.max(1, Math.round(opts.columns ?? 4));
			const g = cartesianGrid(1, cols, rows, opts.diagonals === true);
			g.points = g.points.map((pt) => vec(pt.x, 0, -pt.z));
			return {
				title: `Grid ${cols}×${rows}`,
				points: g.points,
				edges: undirected(g.edges),
				layout: 'none'
			};
		}
		case 'hexGrid': {
			const rows = Math.max(1, Math.round(opts.rows ?? 4));
			const cols = Math.max(1, Math.round(opts.columns ?? 5));
			const g = hexGrid(rows, cols);
			return { title: `Hex ${cols}×${rows}`, ...g, edges: undirected(g.edges), layout: 'none' };
		}
		case 'knn': {
			const pts = scatterDisk(n, 6, rng);
			const k = clampInt(opts.neighbors ?? 3, 1, n - 1);
			return {
				title: `k-NN ${n}`,
				points: pts,
				edges: undirected(knnEdges(pts, k)),
				layout: 'yaw'
			};
		}
		case 'platonic': {
			const g = platonicSpec(opts.platonic ?? 'tetrahedron');
			return { title: g.title, points: g.points, edges: undirected(g.edges), layout: 'yaw' };
		}
		case 'archimedean': {
			const g = archimedeanSpec(opts.archimedean ?? 'cuboctahedron');
			return { title: g.title, points: g.points, edges: undirected(g.edges), layout: 'yaw' };
		}
		case 'antiprism': {
			const g = antiprismSpec(opts.nGons ?? 6);
			return { title: g.title, points: g.points, edges: undirected(g.edges), layout: 'yaw' };
		}
		case 'pyramid': {
			const g = pyramidSpec(opts.nGons ?? 5, opts.fan === true);
			return { title: g.title, points: g.points, edges: undirected(g.edges), layout: 'yaw' };
		}
		case 'cubicLattice': {
			const rows = Math.max(1, Math.round(opts.rows ?? 3));
			const cols = Math.max(1, Math.round(opts.columns ?? 3));
			const layers = Math.max(1, Math.round(opts.layers ?? 3));
			const g = cartesianGrid(rows, cols, layers, opts.diagonals === true);
			return {
				title: `Cubic ${cols}×${rows}×${layers}`,
				points: g.points,
				edges: undirected(g.edges),
				layout: 'yaw'
			};
		}
		case 'diamondLattice': {
			const g = diamondLattice(opts.extent ?? 2);
			return {
				title: 'Diamond lattice',
				points: g.points,
				edges: undirected(g.edges),
				layout: 'yaw'
			};
		}
		case 'unitBall': {
			const pts = scatterBall(n, 5, rng);
			const r = Math.max(0.2, opts.radius ?? 3);
			return {
				title: `Unit-ball ${n}`,
				points: pts,
				edges: undirected(geometricEdges(pts, r)),
				layout: 'yaw'
			};
		}
		case 'spherical': {
			const pts = scatterSphere(n, 5, rng);
			const r = Math.max(0.2, opts.radius ?? 3.2);
			return {
				title: `Spherical ${n}`,
				points: pts,
				edges: undirected(geometricEdges(pts, r)),
				layout: 'yaw'
			};
		}
		case 'delaunay3': {
			const pts = scatterBall(clampNodes(opts.nodes ?? 12, 4), 5, rng);
			return {
				title: `Delaunay ${pts.length}`,
				points: pts,
				edges: undirected(delaunayEdges3(pts)),
				layout: 'yaw'
			};
		}
		case 'helix': {
			const count = clampNodes(opts.nodes ?? 16, 3);
			const turns = Math.max(0.5, opts.turns ?? 2);
			const chord = clampInt(opts.chord ?? 0, 0, count - 1);
			const points: Vec3[] = [];
			const phase = rng.next() * Math.PI * 2;
			for (let i = 0; i < count; i += 1) {
				const t = phase + (i / count) * turns * Math.PI * 2;
				points.push(vec(Math.cos(t) * 4, (i - (count - 1) / 2) * 0.55, Math.sin(t) * 4));
			}
			const edges: [number, number][] = [];
			for (let i = 0; i < count - 1; i += 1) edges.push([i, i + 1]);
			if (chord > 0) {
				for (let i = 0; i < count; i += 1) {
					const j = i + chord;
					if (j < count) edges.push([i, j]);
				}
			}
			return { title: `Helix ${count}`, points, edges: undirected(edges), layout: 'none' };
		}
		case 'torusGrid': {
			const u = Math.max(3, Math.round(opts.rings ?? 4));
			const v = Math.max(3, Math.round(opts.segments ?? 8));
			const R = 5;
			const r = 2;
			const points: Vec3[] = [];
			const id = (i: number, j: number) => i * v + j;
			for (let i = 0; i < u; i += 1) {
				for (let j = 0; j < v; j += 1) {
					const tu = (i / u) * Math.PI * 2;
					const tv = (j / v) * Math.PI * 2;
					points.push(
						vec(
							(R + r * Math.cos(tv)) * Math.cos(tu),
							r * Math.sin(tv),
							(R + r * Math.cos(tv)) * Math.sin(tu)
						)
					);
				}
			}
			const edges: [number, number][] = [];
			for (let i = 0; i < u; i += 1) {
				for (let j = 0; j < v; j += 1) {
					edges.push([id(i, j), id(i, (j + 1) % v)]);
					edges.push([id(i, j), id((i + 1) % u, j)]);
				}
			}
			return {
				title: `Torus ${u}×${v}`,
				points,
				edges: undirected(uniquePairs(edges)),
				layout: 'yaw'
			};
		}
	}
}

/** Generate a graph document for `kind`. Omit `seed` for a fresh draw. */
export function generateGraph(kind: GraphKind, options: GenerateOptions = {}): GraphDocument {
	const seed = options.seed ?? randomSeed();
	const rng = createRng(seed);
	const built = buildKind(kind, options, rng);
	const doc = finish(built.title, built.points, built.edges, rng, options, built.layout);
	return doc;
}

export function fingerprint(doc: GraphDocument): string {
	const nodes = Object.values(doc.nodes)
		.map(
			(n) =>
				`${n.label}:${n.position.x.toFixed(4)},${n.position.y.toFixed(4)},${n.position.z.toFixed(4)}`
		)
		.sort();
	const edges = Object.values(doc.edges)
		.map((e) => {
			const a = doc.nodes[e.from]?.label ?? e.from;
			const b = doc.nodes[e.to]?.label ?? e.to;
			const pair = e.directed ? `${a}->${b}` : [a, b].sort().join('--');
			return `${pair}:${e.weight}:${e.directed ? 1 : 0}`;
		})
		.sort();
	return `${nodeCount(doc)}|${edgeCount(doc)}|${nodes.join(';')}|${edges.join(';')}`;
}
