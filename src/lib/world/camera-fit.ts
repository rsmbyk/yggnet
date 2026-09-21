/**
 * Orbit-camera framing helpers (no Three.js) — used to zoom out until a point is on screen.
 */
export type Vec3 = { x: number; y: number; z: number };

export type OrbitFitInput = {
	target: Vec3;
	eye: Vec3;
	point: Vec3;
	up: Vec3;
	fovDeg: number;
	aspect: number;
	/** World-space sphere radius so the whole ball stays inside the frame. */
	radius?: number;
	/** NDC half-extent to stay inside (1 = clip edge). */
	marginNdc?: number;
	minDistance: number;
	/** Omit or `Infinity` for unbounded zoom-out. */
	maxDistance: number;
};

function resolvedMaxDistance(maxDistance: number, minD: number): number {
	if (!Number.isFinite(maxDistance)) return Infinity;
	return Math.max(minD, maxDistance);
}

/**
 * Perspective far plane that stays ahead of the orbit eye.
 * `defaultFar` is the configured floor; zoom-out raises it so the graph does not clip.
 */
export function farPlaneForOrbitDistance(
	distance: number,
	defaultFar: number,
	margin = 50
): number {
	const d = Number.isFinite(distance) ? Math.abs(distance) : 0;
	const floor = Number.isFinite(defaultFar) && defaultFar > 0 ? defaultFar : 500;
	return Math.max(floor, d * 2 + margin);
}

function searchOrbitFit(fitsAt: (d: number) => boolean, lo: number, maxD: number): number {
	if (fitsAt(lo)) return lo;
	let hi = maxD;
	if (!Number.isFinite(maxD)) {
		hi = Math.max(lo, 1);
		while (!fitsAt(hi)) {
			hi *= 2;
			if (hi > 1e12) return hi;
		}
	} else if (!fitsAt(maxD)) {
		return maxD;
	}
	for (let i = 0; i < 24; i += 1) {
		const mid = (lo + hi) / 2;
		if (fitsAt(mid)) hi = mid;
		else lo = mid;
	}
	return hi;
}

function sub(a: Vec3, b: Vec3): Vec3 {
	return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function add(a: Vec3, b: Vec3): Vec3 {
	return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function scale(a: Vec3, s: number): Vec3 {
	return { x: a.x * s, y: a.y * s, z: a.z * s };
}

function dot(a: Vec3, b: Vec3): number {
	return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a: Vec3, b: Vec3): Vec3 {
	return {
		x: a.y * b.z - a.z * b.y,
		y: a.z * b.x - a.x * b.z,
		z: a.x * b.y - a.y * b.x
	};
}

function length(a: Vec3): number {
	return Math.hypot(a.x, a.y, a.z);
}

function normalize(a: Vec3): Vec3 | null {
	const len = length(a);
	if (!(len > 1e-8)) return null;
	return scale(a, 1 / len);
}

/**
 * Project `point` into NDC XY for a perspective orbit camera looking at `target`.
 * `zCam` is negative in front of the camera (Three.js convention).
 */
export function projectOrbitPoint(
	target: Vec3,
	eye: Vec3,
	point: Vec3,
	up: Vec3,
	fovDeg: number,
	aspect: number
): { ndcX: number; ndcY: number; zCam: number } | null {
	const zAxis = normalize(sub(eye, target));
	if (!zAxis) return null;
	let xAxis = cross(up, zAxis);
	let xLen = length(xAxis);
	if (!(xLen > 1e-8)) {
		const fallback = Math.abs(zAxis.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 };
		xAxis = cross(fallback, zAxis);
		xLen = length(xAxis);
		if (!(xLen > 1e-8)) return null;
	}
	xAxis = scale(xAxis, 1 / xLen);
	const yAxis = cross(zAxis, xAxis);
	const toPoint = sub(point, eye);
	const zCam = dot(toPoint, zAxis);
	const xCam = dot(toPoint, xAxis);
	const yCam = dot(toPoint, yAxis);
	const depth = -zCam;
	if (!(depth > 1e-6)) return { ndcX: 0, ndcY: 0, zCam };
	const tanHalf = Math.tan((fovDeg * Math.PI) / 180 / 2);
	if (!(tanHalf > 0) || !(aspect > 0)) return null;
	return {
		ndcX: xCam / (depth * tanHalf * aspect),
		ndcY: yCam / (depth * tanHalf),
		zCam
	};
}

function inView(
	proj: { ndcX: number; ndcY: number; zCam: number },
	depthRadius: number,
	fovDeg: number,
	aspect: number,
	marginNdc: number
): boolean {
	if (!(proj.zCam < 0)) return false;
	const depth = -proj.zCam;
	const tanHalf = Math.tan((fovDeg * Math.PI) / 180 / 2);
	const rNdcY = depthRadius / (depth * tanHalf);
	const rNdcX = rNdcY / aspect;
	return Math.abs(proj.ndcX) + rNdcX <= marginNdc && Math.abs(proj.ndcY) + rNdcY <= marginNdc;
}

/**
 * Smallest orbit distance along the current eye−target ray that keeps `point` on screen.
 * Never zooms in (result ≥ current distance). Clamped to min/max.
 */
export function orbitDistanceToFitPoint(input: OrbitFitInput): number {
	const current = length(sub(input.eye, input.target));
	const minD = Math.max(input.minDistance, 1e-3);
	const maxD = resolvedMaxDistance(input.maxDistance, minD);
	const start = Number.isFinite(maxD)
		? Math.min(maxD, Math.max(minD, current || minD))
		: Math.max(minD, current || minD);
	const dir = normalize(sub(input.eye, input.target)) ?? { x: 0, y: 1, z: 0 };
	const margin = input.marginNdc ?? 0.9;
	const ball = input.radius ?? 0;

	const fitsAt = (d: number) => {
		const eye = add(input.target, scale(dir, d));
		const proj = projectOrbitPoint(
			input.target,
			eye,
			input.point,
			input.up,
			input.fovDeg,
			input.aspect
		);
		if (!proj) return false;
		return inView(proj, ball, input.fovDeg, input.aspect, margin);
	};

	return searchOrbitFit(fitsAt, start, maxD);
}

export type OrbitFitCloudInput = Omit<OrbitFitInput, 'point'> & {
	points: Vec3[];
};

/** Average of `points`, or null when the list is empty. */
export function centroid(points: Vec3[]): Vec3 | null {
	if (points.length === 0) return null;
	let x = 0;
	let y = 0;
	let z = 0;
	for (const p of points) {
		x += p.x;
		y += p.y;
		z += p.z;
	}
	const n = points.length;
	return { x: x / n, y: y / n, z: z / n };
}

/**
 * Smallest orbit distance along the eye−target ray that keeps every point on screen.
 * May zoom in or out. Clamped to min/max.
 */
export function orbitDistanceToFitPoints(input: OrbitFitCloudInput): number {
	const minD = Math.max(input.minDistance, 1e-3);
	const maxD = resolvedMaxDistance(input.maxDistance, minD);
	const current = length(sub(input.eye, input.target));
	if (input.points.length === 0) {
		return Number.isFinite(maxD)
			? Math.min(maxD, Math.max(minD, current || minD))
			: Math.max(minD, current || minD);
	}
	const dir = normalize(sub(input.eye, input.target)) ?? { x: 0, y: 1, z: 0 };
	const margin = input.marginNdc ?? 0.9;
	const ball = input.radius ?? 0;

	const fitsAt = (d: number) => {
		const eye = add(input.target, scale(dir, d));
		for (const point of input.points) {
			const proj = projectOrbitPoint(
				input.target,
				eye,
				point,
				input.up,
				input.fovDeg,
				input.aspect
			);
			if (!proj) return false;
			if (!inView(proj, ball, input.fovDeg, input.aspect, margin)) return false;
		}
		return true;
	};

	return searchOrbitFit(fitsAt, minD, maxD);
}
