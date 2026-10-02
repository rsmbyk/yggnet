import { dist2, type Vec3 } from './geom';

type Tet = [number, number, number, number];

/**
 * Circumcenter and squared radius of tetrahedron ABCD, or null if degenerate.
 */
export function circumSphere(
	a: Vec3,
	b: Vec3,
	c: Vec3,
	d: Vec3
): { center: Vec3; r2: number } | null {
	const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
	const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
	const w = { x: d.x - a.x, y: d.y - a.y, z: d.z - a.z };
	const n = {
		x: v.y * w.z - v.z * w.y,
		y: v.z * w.x - v.x * w.z,
		z: v.x * w.y - v.y * w.x
	};
	const vol6 = u.x * n.x + u.y * n.y + u.z * n.z;
	if (Math.abs(vol6) < 1e-12) return null;
	const u2 = u.x * u.x + u.y * u.y + u.z * u.z;
	const v2 = v.x * v.x + v.y * v.y + v.z * v.z;
	const w2 = w.x * w.x + w.y * w.y + w.z * w.z;
	const ux = {
		x: (u.y * w.z - u.z * w.y) * v2 - (u.y * v.z - u.z * v.y) * w2,
		y: (u.z * w.x - u.x * w.z) * v2 - (u.z * v.x - u.x * v.z) * w2,
		z: (u.x * w.y - u.y * w.x) * v2 - (u.x * v.y - u.y * v.x) * w2
	};
	// barycentric-style: center = a + (u2 (v×w) + v2 (w×u) + w2 (u×v)) / (2 vol6)
	const vw = { x: v.y * w.z - v.z * w.y, y: v.z * w.x - v.x * w.z, z: v.x * w.y - v.y * w.x };
	const wu = { x: w.y * u.z - w.z * u.y, y: w.z * u.x - w.x * u.z, z: w.x * u.y - w.y * u.x };
	const uv = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
	const inv = 1 / (2 * vol6);
	const center = {
		x: a.x + (u2 * vw.x + v2 * wu.x + w2 * uv.x) * inv,
		y: a.y + (u2 * vw.y + v2 * wu.y + w2 * uv.y) * inv,
		z: a.z + (u2 * vw.z + v2 * wu.z + w2 * uv.z) * inv
	};
	void ux;
	return { center, r2: dist2(center, a) };
}

function tetHasEmptySphere(points: Vec3[], tet: Tet): boolean {
	const sph = circumSphere(points[tet[0]], points[tet[1]], points[tet[2]], points[tet[3]]);
	if (!sph) return false;
	for (let i = 0; i < points.length; i += 1) {
		if (tet.includes(i)) continue;
		if (dist2(sph.center, points[i]) < sph.r2 - 1e-8) return false;
	}
	return true;
}

/**
 * 3D Delaunay edges via brute-force empty circumspheres (n ≤ 40).
 * Falls back to nearest-neighbor if too few tets (near-coplanar clouds).
 */
export function delaunayEdges3(points: Vec3[]): [number, number][] {
	const n = points.length;
	const edgeSet = new Set<string>();
	const add = (a: number, b: number) => {
		if (a === b) return;
		const lo = Math.min(a, b);
		const hi = Math.max(a, b);
		edgeSet.add(`${lo}-${hi}`);
	};
	if (n < 4) {
		for (let i = 0; i < n; i += 1) {
			for (let j = i + 1; j < n; j += 1) add(i, j);
		}
	} else {
		for (let i = 0; i < n; i += 1) {
			for (let j = i + 1; j < n; j += 1) {
				for (let k = j + 1; k < n; k += 1) {
					for (let l = k + 1; l < n; l += 1) {
						const tet: Tet = [i, j, k, l];
						if (!tetHasEmptySphere(points, tet)) continue;
						add(i, j);
						add(i, k);
						add(i, l);
						add(j, k);
						add(j, l);
						add(k, l);
					}
				}
			}
		}
	}
	if (edgeSet.size === 0 && n >= 2) {
		let min = Infinity;
		for (let i = 0; i < n; i += 1) {
			for (let j = i + 1; j < n; j += 1) {
				min = Math.min(min, dist2(points[i], points[j]));
			}
		}
		const cap = min * 1.44;
		for (let i = 0; i < n; i += 1) {
			for (let j = i + 1; j < n; j += 1) {
				if (dist2(points[i], points[j]) <= cap + 1e-9) add(i, j);
			}
		}
	}
	return [...edgeSet].map((key) => {
		const [a, b] = key.split('-').map(Number);
		return [a, b];
	});
}
