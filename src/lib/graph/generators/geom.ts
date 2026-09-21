export interface Vec3 {
	x: number;
	y: number;
	z: number;
}

export function vec(x: number, y: number, z: number): Vec3 {
	return { x, y, z };
}

export function scale(a: Vec3, s: number): Vec3 {
	return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function dist(a: Vec3, b: Vec3): number {
	return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function dist2(a: Vec3, b: Vec3): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	const dz = a.z - b.z;
	return dx * dx + dy * dy + dz * dz;
}

export function rotateY(p: Vec3, yaw: number): Vec3 {
	const c = Math.cos(yaw);
	const s = Math.sin(yaw);
	return { x: p.x * c - p.z * s, y: p.y, z: p.x * s + p.z * c };
}

export function rotateX(p: Vec3, pitch: number): Vec3 {
	const c = Math.cos(pitch);
	const s = Math.sin(pitch);
	return { x: p.x, y: p.y * c - p.z * s, z: p.y * s + p.z * c };
}

export function rotateZ(p: Vec3, roll: number): Vec3 {
	const c = Math.cos(roll);
	const s = Math.sin(roll);
	return { x: p.x * c - p.y * s, y: p.x * s + p.y * c, z: p.z };
}

export function tumble(p: Vec3, yaw: number, pitch: number, roll: number): Vec3 {
	return rotateZ(rotateX(rotateY(p, yaw), pitch), roll);
}

export function normalizeRadius(points: Vec3[], radius: number): Vec3[] {
	if (points.length === 0) return points;
	let max = 0;
	for (const p of points) {
		max = Math.max(max, Math.hypot(p.x, p.y, p.z));
	}
	if (max < 1e-9) return points;
	const s = radius / max;
	return points.map((p) => scale(p, s));
}

/** Connect vertices whose distance is within `slack` of the minimum positive distance. */
export function edgesByNearest(points: Vec3[], slack = 1.2): [number, number][] {
	let min = Infinity;
	for (let i = 0; i < points.length; i += 1) {
		for (let j = i + 1; j < points.length; j += 1) {
			const d = dist(points[i], points[j]);
			if (d > 1e-6 && d < min) min = d;
		}
	}
	if (!Number.isFinite(min)) return [];
	const cap = min * slack;
	const edges: [number, number][] = [];
	for (let i = 0; i < points.length; i += 1) {
		for (let j = i + 1; j < points.length; j += 1) {
			if (dist(points[i], points[j]) <= cap + 1e-6) edges.push([i, j]);
		}
	}
	return edges;
}

export function uniquePairs(pairs: Array<[number, number]>): [number, number][] {
	const seen = new Set<string>();
	const out: [number, number][] = [];
	for (const [a, b] of pairs) {
		if (a === b) continue;
		const lo = Math.min(a, b);
		const hi = Math.max(a, b);
		const key = `${lo}-${hi}`;
		if (seen.has(key)) continue;
		seen.add(key);
		out.push([lo, hi]);
	}
	return out;
}

export function phi(): number {
	return (1 + Math.sqrt(5)) / 2;
}

export function evenPerms3(x: number, y: number, z: number): Vec3[] {
	return [vec(x, y, z), vec(z, x, y), vec(y, z, x)];
}

export function allSignPerms(x: number, y: number, z: number): Vec3[] {
	const out: Vec3[] = [];
	for (const sx of [-1, 1]) {
		for (const sy of [-1, 1]) {
			for (const sz of [-1, 1]) {
				out.push(vec(sx * x, sy * y, sz * z));
			}
		}
	}
	return out;
}

/** Center-to-center keep-out for generated nodes (world units). */
export const GENERATE_MIN_DISTANCE = 4;

/** Uniform scale is skipped past this factor so a 0.01 pair cannot explode the cloud. */
const MAX_UNIFORM_SCALE = 6;

function minPairwise(points: Vec3[]): number {
	let min = Infinity;
	for (let i = 0; i < points.length; i += 1) {
		for (let j = i + 1; j < points.length; j += 1) {
			const d = dist(points[i], points[j]);
			if (d < min) min = d;
		}
	}
	return min;
}

function centroidOf(points: Vec3[]): Vec3 {
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

function scaleAbout(points: Vec3[], origin: Vec3, s: number): Vec3[] {
	return points.map((p) =>
		vec(
			origin.x + (p.x - origin.x) * s,
			origin.y + (p.y - origin.y) * s,
			origin.z + (p.z - origin.z) * s
		)
	);
}

function isFree(p: Vec3, occupied: Vec3[], minDist: number): boolean {
	const min2 = minDist * minDist;
	for (const o of occupied) {
		if (dist2(p, o) < min2 - 1e-8) return false;
	}
	return true;
}

function findFreePoint(preferred: Vec3, occupied: Vec3[], minDist: number, planar: boolean): Vec3 {
	if (isFree(preferred, occupied, minDist)) return preferred;
	for (let ring = 1; ring <= 48; ring += 1) {
		const n = 6 * ring;
		const rad = minDist * ring;
		for (let slot = 0; slot < n; slot += 1) {
			const ang = (slot * 2 * Math.PI) / n;
			const xz = vec(
				preferred.x + Math.cos(ang) * rad,
				preferred.y,
				preferred.z + Math.sin(ang) * rad
			);
			if (isFree(xz, occupied, minDist)) return xz;
			if (planar) continue;
			for (const sy of [1, -1]) {
				for (let y = 1; y <= ring; y += 1) {
					const p = vec(xz.x, preferred.y + sy * minDist * y, xz.z);
					if (isFree(p, occupied, minDist)) return p;
				}
			}
		}
	}
	return vec(preferred.x + minDist * (occupied.length + 1), preferred.y, preferred.z);
}

/** Drop height into the XZ plane so stacked 3D layers become a flat drawing. */
export function projectToPlane(points: Vec3[]): Vec3[] {
	return points.map((p) => vec(p.x + p.y * 0.65, 0, p.z + p.y * 0.35));
}

/**
 * Guarantee every pair of points is at least `minDist` apart.
 * Prefers a uniform scale about the centroid so lattices stay lattices;
 * falls back to sequential 3D hex search for coincident / degenerate sets.
 * When `planar`, the search stays in XZ so a 2D drawing does not grow height.
 */
export function enforceMinDistance(
	points: Vec3[],
	minDist = GENERATE_MIN_DISTANCE,
	planar = false
): Vec3[] {
	if (points.length < 2) return points;
	const min = minPairwise(points);
	if (min >= minDist - 1e-6) return points;
	if (min > 1e-4) {
		const factor = minDist / min;
		if (factor <= MAX_UNIFORM_SCALE) return scaleAbout(points, centroidOf(points), factor);
	}
	const out: Vec3[] = [];
	for (const p of points) out.push(findFreePoint(p, out, minDist, planar));
	return out;
}
