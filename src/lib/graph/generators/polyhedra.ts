import {
	allSignPerms,
	edgesByNearest,
	evenPerms3,
	normalizeRadius,
	phi,
	uniquePairs,
	vec,
	type Vec3
} from './geom';
import type { ArchimedeanSolid, PlatonicSolid } from './types';

export type SolidSpec = { title: string; points: Vec3[]; edges: [number, number][] };

function dedupe(points: Vec3[]): Vec3[] {
	const seen = new Set<string>();
	const out: Vec3[] = [];
	for (const p of points) {
		const k = `${p.x.toFixed(6)},${p.y.toFixed(6)},${p.z.toFixed(6)}`;
		if (seen.has(k)) continue;
		seen.add(k);
		out.push(p);
	}
	return out;
}

export function platonicSpec(solid: PlatonicSolid): SolidSpec {
	const g = phi();
	switch (solid) {
		case 'tetrahedron': {
			const points = normalizeRadius(
				[vec(1, 1, 1), vec(1, -1, -1), vec(-1, 1, -1), vec(-1, -1, 1)],
				4
			);
			const edges: [number, number][] = [
				[0, 1],
				[0, 2],
				[0, 3],
				[1, 2],
				[1, 3],
				[2, 3]
			];
			return { title: 'Tetrahedron', points, edges };
		}
		case 'cube': {
			const points = normalizeRadius(allSignPerms(1, 1, 1), 4);
			return { title: 'Cube', points, edges: edgesByNearest(points, 1.05) };
		}
		case 'octahedron': {
			const points = normalizeRadius(
				[vec(1, 0, 0), vec(-1, 0, 0), vec(0, 1, 0), vec(0, -1, 0), vec(0, 0, 1), vec(0, 0, -1)],
				4
			);
			return { title: 'Octahedron', points, edges: edgesByNearest(points, 1.05) };
		}
		case 'dodecahedron': {
			const cube = allSignPerms(1, 1, 1);
			const even = [
				...allSignPerms(0, 1 / g, g).flatMap((p) => evenPerms3(p.x, p.y, p.z)),
				...allSignPerms(0, 1 / g, g)
			];
			const points = normalizeRadius(dedupe([...cube, ...even]), 5);
			return { title: 'Dodecahedron', points, edges: edgesByNearest(points, 1.08) };
		}
		case 'icosahedron': {
			const pts = [
				...evenPerms3(0, 1, g),
				...evenPerms3(0, 1, -g),
				...evenPerms3(0, -1, g),
				...evenPerms3(0, -1, -g)
			];
			const points = normalizeRadius(dedupe(pts), 5);
			return { title: 'Icosahedron', points, edges: edgesByNearest(points, 1.08) };
		}
	}
}

export function archimedeanSpec(solid: ArchimedeanSolid): SolidSpec {
	const g = phi();
	switch (solid) {
		case 'truncatedTetrahedron': {
			const raw: Vec3[] = [];
			for (const p of [vec(1, 1, 3), vec(1, 3, 1), vec(3, 1, 1)]) {
				raw.push(...allSignPerms(p.x, p.y, p.z));
			}
			const points = normalizeRadius(dedupe(raw), 5);
			return { title: 'Truncated tetrahedron', points, edges: edgesByNearest(points, 1.08) };
		}
		case 'cuboctahedron': {
			const raw = [...allSignPerms(1, 1, 0), ...allSignPerms(1, 0, 1), ...allSignPerms(0, 1, 1)];
			const points = normalizeRadius(dedupe(raw), 5);
			return { title: 'Cuboctahedron', points, edges: edgesByNearest(points, 1.08) };
		}
		case 'truncatedCube': {
			const a = 1 + Math.SQRT2;
			const raw = [...allSignPerms(a, 1, 1), ...allSignPerms(1, a, 1), ...allSignPerms(1, 1, a)];
			const points = normalizeRadius(dedupe(raw), 5);
			return { title: 'Truncated cube', points, edges: edgesByNearest(points, 1.06) };
		}
		case 'truncatedOctahedron': {
			const raw = [
				...allSignPerms(0, 1, 2),
				...allSignPerms(0, 2, 1),
				...allSignPerms(1, 0, 2),
				...allSignPerms(1, 2, 0),
				...allSignPerms(2, 0, 1),
				...allSignPerms(2, 1, 0)
			];
			const points = normalizeRadius(dedupe(raw), 5);
			return { title: 'Truncated octahedron', points, edges: edgesByNearest(points, 1.06) };
		}
		case 'rhombicuboctahedron': {
			const a = 1 + Math.SQRT2;
			const raw = [...allSignPerms(1, a, a), ...allSignPerms(a, 1, a), ...allSignPerms(a, a, 1)];
			const points = normalizeRadius(dedupe(raw), 5);
			return { title: 'Rhombicuboctahedron', points, edges: edgesByNearest(points, 1.08) };
		}
		case 'snubCube': {
			let t = 1.8;
			for (let i = 0; i < 12; i += 1) {
				t = t - (t ** 3 - t ** 2 - t - 1) / (3 * t ** 2 - 2 * t - 1);
			}
			const raw: Vec3[] = [];
			const coords: [number, number, number][] = [
				[1, 1 / t, t],
				[1, -1 / t, -t],
				[-1, 1 / t, -t],
				[-1, -1 / t, t]
			];
			for (const [x, y, z] of coords) {
				raw.push(vec(x, y, z), vec(z, x, y), vec(y, z, x));
				raw.push(vec(-x, z, y), vec(-z, y, x), vec(-y, x, z));
			}
			const points = normalizeRadius(dedupe(raw), 5);
			return { title: 'Snub cube', points, edges: edgesByNearest(points, 1.12) };
		}
		case 'icosidodecahedron': {
			const a = 0.5;
			const b = g / 2;
			const c = (g * g) / 2;
			const raw: Vec3[] = [...evenPerms3(0, 0, g), ...evenPerms3(0, 0, -g)];
			for (const sx of [-1, 1]) {
				for (const sy of [-1, 1]) {
					for (const sz of [-1, 1]) {
						const p = vec(sx * a, sy * b, sz * c);
						raw.push(...evenPerms3(p.x, p.y, p.z));
					}
				}
			}
			const points = normalizeRadius(dedupe(raw), 5.5);
			return { title: 'Icosidodecahedron', points, edges: edgesByNearest(points, 1.1) };
		}
	}
}

export function antiprismSpec(n: number): SolidSpec {
	const count = Math.max(3, n);
	const points: Vec3[] = [];
	const h = 1.6;
	const rot = Math.PI / count;
	for (let i = 0; i < count; i += 1) {
		const t = (i / count) * Math.PI * 2;
		points.push(vec(Math.cos(t) * 4, h, Math.sin(t) * 4));
	}
	for (let i = 0; i < count; i += 1) {
		const t = (i / count) * Math.PI * 2 + rot;
		points.push(vec(Math.cos(t) * 4, -h, Math.sin(t) * 4));
	}
	const edges: [number, number][] = [];
	for (let i = 0; i < count; i += 1) {
		edges.push([i, (i + 1) % count]);
		edges.push([count + i, count + ((i + 1) % count)]);
		edges.push([i, count + i], [i, count + ((i + 1) % count)]);
	}
	return { title: `Antiprism ${count}`, points, edges: uniquePairs(edges) };
}

export function pyramidSpec(n: number, fan: boolean): SolidSpec {
	const sides = Math.max(3, n);
	const points: Vec3[] = [vec(0, 3.2, 0)];
	for (let i = 0; i < sides; i += 1) {
		const span = fan ? Math.PI * 0.9 : Math.PI * 2;
		const a = fan ? -span / 2 + (i / Math.max(sides - 1, 1)) * span : (i / sides) * Math.PI * 2;
		points.push(vec(Math.cos(a) * 4, 0, Math.sin(a) * 4));
	}
	const edges: [number, number][] = [];
	for (let i = 1; i <= sides; i += 1) {
		edges.push([0, i]);
		if (i < sides) edges.push([i, i + 1]);
		else if (!fan) edges.push([sides, 1]);
	}
	return { title: fan ? `Fan ${sides}` : `Pyramid ${sides}`, points, edges: uniquePairs(edges) };
}
