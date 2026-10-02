import { allSignPerms, edgesByNearest, normalizeRadius, uniquePairs, vec, type Vec3 } from './geom';
import type { NamedGraphId } from './types';

export type NamedSpec = {
	title: string;
	points: Vec3[];
	edges: [number, number][];
	tumble: boolean;
};

function lcf(n: number, offsets: number[]): [number, number][] {
	const edges: [number, number][] = [];
	for (let i = 0; i < n; i += 1) {
		edges.push([i, (i + 1) % n]);
		const off = offsets[i % offsets.length];
		edges.push([i, (i + off + n * 8) % n]);
	}
	return uniquePairs(edges);
}

function circle(n: number, radius: number, y = 0): Vec3[] {
	return Array.from({ length: n }, (_, i) => {
		const t = (i / n) * Math.PI * 2;
		return vec(Math.cos(t) * radius, y, Math.sin(t) * radius);
	});
}

function generalizedPetersen(n: number, k: number): { points: Vec3[]; edges: [number, number][] } {
	const outer = circle(n, 5);
	const inner = circle(n, 2.4);
	const points = [...outer, ...inner];
	const edges: [number, number][] = [];
	for (let i = 0; i < n; i += 1) {
		edges.push([i, (i + 1) % n]);
		edges.push([i, n + i]);
		edges.push([n + i, n + ((i + k) % n)]);
	}
	return { points, edges: uniquePairs(edges) };
}

function levi(
	pointCount: number,
	lines: number[][]
): { points: Vec3[]; edges: [number, number][] } {
	const n = pointCount + lines.length;
	const points = circle(n, 5);
	const edges: [number, number][] = [];
	for (let li = 0; li < lines.length; li += 1) {
		const lineV = pointCount + li;
		for (const p of lines[li]) edges.push([p, lineV]);
	}
	return { points, edges: uniquePairs(edges) };
}

function sierpinskiGasket(depth: number): { points: Vec3[]; edges: [number, number][] } {
	const d = Math.max(0, Math.round(depth));
	const corners = [vec(-4, 0, -2.2), vec(4, 0, -2.2), vec(0, 0, 4)];
	const points: Vec3[] = [];
	const key = (p: Vec3) => `${p.x.toFixed(6)},${p.z.toFixed(6)}`;
	const index = new Map<string, number>();
	const idOf = (p: Vec3) => {
		const k = key(p);
		const found = index.get(k);
		if (found !== undefined) return found;
		const i = points.length;
		index.set(k, i);
		points.push(p);
		return i;
	};
	const edges: [number, number][] = [];
	const mid = (a: Vec3, b: Vec3): Vec3 => vec((a.x + b.x) / 2, 0, (a.z + b.z) / 2);
	const rec = (a: Vec3, b: Vec3, c: Vec3, depthLeft: number) => {
		if (depthLeft === 0) {
			const ia = idOf(a);
			const ib = idOf(b);
			const ic = idOf(c);
			edges.push([ia, ib], [ib, ic], [ic, ia]);
			return;
		}
		const ab = mid(a, b);
		const bc = mid(b, c);
		const ca = mid(c, a);
		rec(a, ab, ca, depthLeft - 1);
		rec(ab, b, bc, depthLeft - 1);
		rec(ca, bc, c, depthLeft - 1);
	};
	rec(corners[0], corners[1], corners[2], d);
	return { points, edges: uniquePairs(edges) };
}

function sierpinskiTetrahedron(depth: number): { points: Vec3[]; edges: [number, number][] } {
	const d = Math.max(0, Math.round(depth));
	const corners = [vec(1, 1, 1), vec(1, -1, -1), vec(-1, 1, -1), vec(-1, -1, 1)];
	const points: Vec3[] = [];
	const key = (p: Vec3) => `${p.x.toFixed(5)},${p.y.toFixed(5)},${p.z.toFixed(5)}`;
	const index = new Map<string, number>();
	const idOf = (p: Vec3) => {
		const k = key(p);
		const found = index.get(k);
		if (found !== undefined) return found;
		const i = points.length;
		index.set(k, i);
		points.push(p);
		return i;
	};
	const edges: [number, number][] = [];
	const mid = (a: Vec3, b: Vec3): Vec3 => vec((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2);
	const rec = (t: Vec3[], depthLeft: number) => {
		if (depthLeft === 0) {
			const ids = t.map(idOf);
			for (let i = 0; i < 4; i += 1) {
				for (let j = i + 1; j < 4; j += 1) edges.push([ids[i], ids[j]]);
			}
			return;
		}
		rec([t[0], mid(t[0], t[1]), mid(t[0], t[2]), mid(t[0], t[3])], depthLeft - 1);
		rec([t[1], mid(t[1], t[0]), mid(t[1], t[2]), mid(t[1], t[3])], depthLeft - 1);
		rec([t[2], mid(t[2], t[0]), mid(t[2], t[1]), mid(t[2], t[3])], depthLeft - 1);
		rec([t[3], mid(t[3], t[0]), mid(t[3], t[1]), mid(t[3], t[2])], depthLeft - 1);
	};
	rec(corners, d);
	return { points: normalizeRadius(points, 5), edges: uniquePairs(edges) };
}

function isPrime(n: number): boolean {
	if (n < 2) return false;
	for (let d = 2; d * d <= n; d += 1) {
		if (n % d === 0) return false;
	}
	return true;
}

/** Paley graph of F_q for q in the Generate picker. */
export function paleyGraph(q: number): { points: Vec3[]; edges: [number, number][] } {
	const order = [5, 9, 13, 17, 25, 29, 37].includes(q) ? q : 13;
	const elems: number[][] = [];
	if (isPrime(order)) {
		for (let i = 0; i < order; i += 1) elems.push([i]);
	} else {
		const p = Math.round(Math.sqrt(order));
		for (let a = 0; a < p; a += 1) {
			for (let b = 0; b < p; b += 1) elems.push([a, b]);
		}
	}
	const p = isPrime(order) ? order : Math.round(Math.sqrt(order));
	const subF = (u: number[], v: number[]): number[] => u.map((x, i) => (((x - v[i]) % p) + p) % p);
	const mulF = (u: number[], v: number[]): number[] => {
		if (u.length === 1) return [(u[0] * v[0]) % p];
		// F_{p^2} = F_p[x]/(x^2 - nr) with nr a quadratic nonresidue (2 for p=3, 2 for p=5)
		const nr = p === 3 ? 2 : 2;
		const a = (u[0] * v[0] + nr * u[1] * v[1]) % p;
		const b = (u[0] * v[1] + u[1] * v[0]) % p;
		return [a, b];
	};
	const squares = new Set<string>();
	for (const e of elems) {
		if (e.every((x) => x === 0)) continue;
		const sq = mulF(e, e);
		squares.add(sq.join(','));
	}
	const edges: [number, number][] = [];
	for (let i = 0; i < elems.length; i += 1) {
		for (let j = i + 1; j < elems.length; j += 1) {
			const d = subF(elems[i], elems[j]);
			if (squares.has(d.join(','))) edges.push([i, j]);
		}
	}
	return { points: circle(elems.length, 5), edges };
}

const FANO_LINES = [
	[0, 1, 3],
	[1, 2, 4],
	[2, 3, 5],
	[3, 4, 6],
	[4, 5, 0],
	[5, 6, 1],
	[6, 0, 2]
];

const PAPPUS_LINES = [
	[0, 1, 2],
	[3, 4, 5],
	[6, 7, 8],
	[0, 3, 6],
	[1, 4, 7],
	[2, 5, 8],
	[0, 4, 8],
	[1, 5, 6],
	[2, 3, 7]
];

const CSASZAR_FACES: [number, number, number][] = [
	[0, 1, 2],
	[0, 1, 3],
	[0, 2, 4],
	[0, 3, 5],
	[0, 4, 6],
	[0, 5, 6],
	[1, 2, 5],
	[1, 3, 6],
	[1, 4, 5],
	[1, 4, 6],
	[2, 3, 4],
	[2, 3, 6],
	[2, 5, 6],
	[3, 4, 5]
];

function goldnerHarary(): { points: Vec3[]; edges: [number, number][] } {
	const N = vec(0, 3, 0);
	const S = vec(0, -3, 0);
	const A = vec(3.2, 0, 0);
	const B = vec(-1.6, 0, 2.8);
	const C = vec(-1.6, 0, -2.8);
	const poles = [N, S, A, B, C];
	const faces: [Vec3, Vec3, Vec3][] = [
		[N, A, B],
		[N, B, C],
		[N, C, A],
		[S, A, B],
		[S, B, C],
		[S, C, A]
	];
	const extras = faces.map(([a, b, c]) =>
		vec((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3)
	);
	const points = [...poles, ...extras];
	const edges: [number, number][] = [
		[0, 2],
		[0, 3],
		[0, 4],
		[1, 2],
		[1, 3],
		[1, 4],
		[2, 3],
		[3, 4],
		[4, 2]
	];
	for (let f = 0; f < 6; f += 1) {
		const v = 5 + f;
		if (f === 0) edges.push([v, 0], [v, 2], [v, 3]);
		else if (f === 1) edges.push([v, 0], [v, 3], [v, 4]);
		else if (f === 2) edges.push([v, 0], [v, 4], [v, 2]);
		else if (f === 3) edges.push([v, 1], [v, 2], [v, 3]);
		else if (f === 4) edges.push([v, 1], [v, 3], [v, 4]);
		else edges.push([v, 1], [v, 4], [v, 2]);
	}
	return { points, edges: uniquePairs(edges) };
}

function cell24(): { points: Vec3[]; edges: [number, number][] } {
	const v4: [number, number, number, number][] = [];
	const axes = [0, 1, 2, 3];
	for (let i = 0; i < 4; i += 1) {
		for (let j = i + 1; j < 4; j += 1) {
			for (const s1 of [-1, 1]) {
				for (const s2 of [-1, 1]) {
					const p: [number, number, number, number] = [0, 0, 0, 0];
					p[axes[i]] = s1;
					p[axes[j]] = s2;
					v4.push(p);
				}
			}
		}
	}
	const points: Vec3[] = v4.map((p) =>
		vec(p[0] + 0.4 * p[3], p[1] + 0.2 * p[3], p[2] - 0.35 * p[3])
	);
	const edges: [number, number][] = [];
	for (let i = 0; i < v4.length; i += 1) {
		for (let j = i + 1; j < v4.length; j += 1) {
			let dot = 0;
			for (let k = 0; k < 4; k += 1) dot += v4[i][k] * v4[j][k];
			if (Math.abs(dot - 1) < 1e-9) edges.push([i, j]);
		}
	}
	return { points: normalizeRadius(points, 5), edges };
}

function mycielskiC5(): { points: Vec3[]; edges: [number, number][] } {
	const points = [...circle(5, 4.2), ...circle(5, 2.2), vec(0, 0, 0)];
	const edges: [number, number][] = [];
	for (let i = 0; i < 5; i += 1) {
		edges.push([i, (i + 1) % 5]);
		edges.push([5 + i, (i + 4) % 5], [5 + i, (i + 1) % 5]);
		edges.push([10, 5 + i]);
	}
	return { points, edges: uniquePairs(edges) };
}

/**
 * Combinatorics + layout for a catalog named graph.
 */
export function namedSpec(id: NamedGraphId, paleyQ = 13, sierpinskiDepth = 2): NamedSpec {
	switch (id) {
		case 'petersen': {
			const g = generalizedPetersen(5, 2);
			return { title: 'Petersen', ...g, tumble: false };
		}
		case 'desargues': {
			const g = generalizedPetersen(10, 3);
			return { title: 'Desargues', ...g, tumble: false };
		}
		case 'wagner': {
			const n = 8;
			const edges: [number, number][] = [];
			for (let i = 0; i < n; i += 1) {
				edges.push([i, (i + 1) % n], [i, (i + 4) % n]);
			}
			return { title: 'Wagner', points: circle(n, 4.5), edges: uniquePairs(edges), tumble: false };
		}
		case 'heawood': {
			const g = levi(7, FANO_LINES);
			return { title: 'Heawood', ...g, tumble: false };
		}
		case 'pappus': {
			const g = levi(9, PAPPUS_LINES);
			return { title: 'Pappus', ...g, tumble: false };
		}
		case 'grotzsch': {
			const g = mycielskiC5();
			return { title: 'Grötzsch', ...g, tumble: false };
		}
		case 'frucht': {
			return {
				title: 'Frucht',
				points: circle(12, 5),
				edges: lcf(12, [-5, -2, -4, 2, 5, -2, 2, 5, -2, -5, 4, 2]),
				tumble: false
			};
		}
		case 'herschel': {
			const edges: [number, number][] = [
				[0, 1],
				[0, 2],
				[0, 3],
				[1, 4],
				[1, 5],
				[2, 4],
				[2, 6],
				[3, 5],
				[3, 6],
				[4, 7],
				[4, 8],
				[5, 7],
				[5, 9],
				[6, 8],
				[6, 9],
				[7, 10],
				[8, 10],
				[9, 10]
			];
			return { title: 'Herschel', points: circle(11, 5), edges, tumble: false };
		}
		case 'chvatal': {
			const edges: [number, number][] = [];
			for (let i = 0; i < 12; i += 1) {
				edges.push([i, (i + 1) % 12], [i, (i + 5) % 12]);
			}
			return { title: 'Chvátal', points: circle(12, 5), edges: uniquePairs(edges), tumble: false };
		}
		case 'coxeter': {
			const n = 28;
			const edges: [number, number][] = [];
			for (let i = 0; i < n; i += 1) {
				edges.push([i, (i + 1) % n], [i, (i + 14) % n]);
			}
			return { title: 'Coxeter', points: circle(n, 6.5), edges: uniquePairs(edges), tumble: false };
		}
		case 'tutteCoxeter': {
			return {
				title: 'Tutte–Coxeter',
				points: circle(30, 6.8),
				edges: lcf(30, [-13, -9, 7, -7, 9, 13]),
				tumble: false
			};
		}
		case 'clebsch': {
			const n = 16;
			const edges: [number, number][] = [];
			for (let i = 0; i < n; i += 1) {
				for (let j = i + 1; j < n; j += 1) {
					const d = popcount(i ^ j);
					if (d === 1 || d === 4) edges.push([i, j]);
				}
			}
			return { title: 'Clebsch', points: circle(n, 5.5), edges, tumble: false };
		}
		case 'dyck': {
			return {
				title: 'Dyck',
				points: circle(32, 7),
				edges: lcf(32, [5, -5, 13, -13]),
				tumble: false
			};
		}
		case 'goldnerHarary': {
			const g = goldnerHarary();
			return { title: 'Goldner–Harary', ...g, tumble: true };
		}
		case 'paley': {
			const g = paleyGraph(paleyQ);
			return { title: `Paley ${g.points.length}`, ...g, tumble: false };
		}
		case 'sierpinskiGasket': {
			const g = sierpinskiGasket(sierpinskiDepth);
			return { title: 'Sierpinski gasket', ...g, tumble: false };
		}
		case 'sierpinskiTetrahedron': {
			const g = sierpinskiTetrahedron(sierpinskiDepth);
			return { title: 'Sierpinski tetrahedron', ...g, tumble: true };
		}
		case 'cell24': {
			const g = cell24();
			return { title: '24-cell', ...g, tumble: true };
		}
		case 'csaszar': {
			const points = circle(7, 3).map((p, i) => vec(p.x, (i % 3) * 1.4 - 1.4, p.z));
			const edges: [number, number][] = [];
			for (let i = 0; i < 7; i += 1) {
				for (let j = i + 1; j < 7; j += 1) edges.push([i, j]);
			}
			return { title: 'Császár', points, edges, tumble: true };
		}
		case 'szilassi': {
			const facePts = CSASZAR_FACES.map(([a, b, c]) => {
				const pts = circle(7, 3);
				return vec(
					(pts[a].x + pts[b].x + pts[c].x) / 3,
					((a % 3) + (b % 3) + (c % 3)) * 0.4 - 1.2,
					(pts[a].z + pts[b].z + pts[c].z) / 3
				);
			});
			const edges: [number, number][] = [];
			for (let i = 0; i < CSASZAR_FACES.length; i += 1) {
				for (let j = i + 1; j < CSASZAR_FACES.length; j += 1) {
					const A = CSASZAR_FACES[i];
					const B = CSASZAR_FACES[j];
					let shared = 0;
					for (const x of A) if (B.includes(x)) shared += 1;
					if (shared === 2) edges.push([i, j]);
				}
			}
			return { title: 'Szilassi', points: facePts, edges, tumble: true };
		}
		case 'stella': {
			const t1 = [vec(1, 1, 1), vec(1, -1, -1), vec(-1, 1, -1), vec(-1, -1, 1)];
			const t2 = [vec(-1, -1, -1), vec(-1, 1, 1), vec(1, -1, 1), vec(1, 1, -1)];
			const points = normalizeRadius([...t1, ...t2], 4.5);
			const edges: [number, number][] = [];
			for (let i = 0; i < 4; i += 1) {
				for (let j = i + 1; j < 4; j += 1) {
					edges.push([i, j], [4 + i, 4 + j]);
				}
			}
			return { title: 'Stella octangula', points, edges, tumble: true };
		}
		case 'rhombicDodecahedron': {
			const cube = allSignPerms(1, 1, 1);
			const oct = [
				vec(2, 0, 0),
				vec(-2, 0, 0),
				vec(0, 2, 0),
				vec(0, -2, 0),
				vec(0, 0, 2),
				vec(0, 0, -2)
			];
			const points = normalizeRadius([...cube, ...oct], 5);
			return {
				title: 'Rhombic dodecahedron',
				points,
				edges: edgesByNearest(points, 1.15),
				tumble: true
			};
		}
	}
}

function popcount(n: number): number {
	let c = 0;
	let x = n;
	while (x) {
		c += x & 1;
		x >>= 1;
	}
	return c;
}

export { generalizedPetersen };
