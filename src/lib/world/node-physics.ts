/**
 * Kinematic node placement helpers: floor clamp + sphere–sphere blocking.
 * No gravity. Dragged / placed nodes may not penetrate other nodes.
 */

export type Vec3 = { x: number; y: number; z: number };

/** Sphere center may not go below floorY + radius. */
export function clampToFloor(pos: Vec3, floorY: number, radius: number): Vec3 {
	const yMin = floorY + radius;
	return pos.y < yMin ? { x: pos.x, y: yMin, z: pos.z } : pos;
}

/** Center-to-center keep-out: spheres may not sit closer than this. */
export function minCenterDistance(radius: number, padding = 0): number {
	return radius * 2 + padding;
}

/** True if two spheres of equal radius overlap (strict penetration). */
export function spheresOverlap(a: Vec3, b: Vec3, radius: number, padding = 0): boolean {
	const r = minCenterDistance(radius, padding);
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	const dz = a.z - b.z;
	return dx * dx + dy * dy + dz * dz < r * r - 1e-8;
}

/**
 * Accept `proposed` only if it does not overlap any blocker.
 * Otherwise keep `previous` (last valid pose).
 */
export function resolveMoveAgainstNodes(
	proposed: Vec3,
	previous: Vec3,
	blockers: Iterable<Vec3>,
	radius: number,
	floorY: number,
	padding = 0
): Vec3 {
	const next = clampToFloor(proposed, floorY, radius);
	for (const other of blockers) {
		if (spheresOverlap(next, other, radius, padding)) {
			return clampToFloor(previous, floorY, radius);
		}
	}
	return next;
}

/**
 * Extra gap used only when placing a new node.
 * Centers must stay at least four radii apart (`2×radius` spheres + this padding).
 */
export function createNodePadding(nodeRadius: number): number {
	return nodeRadius * 2;
}

/** Snap free axes of `pos` to a world grid when `enabled` (Alt while moving). */
export function snapToGrid(
	pos: Vec3,
	plane: 'xy' | 'yz' | 'xz',
	step: number,
	enabled: boolean
): Vec3 {
	if (!enabled || !(step > 0)) return pos;
	const s = (v: number) => Math.round(v / step) * step;
	if (plane === 'xy') return { x: s(pos.x), y: s(pos.y), z: pos.z };
	if (plane === 'yz') return { x: pos.x, y: s(pos.y), z: s(pos.z) };
	return { x: s(pos.x), y: pos.y, z: s(pos.z) };
}

/**
 * Find a floor-resting position near `preferred` that does not overlap blockers.
 * Search rings are spaced by `minCenterDistance` so each ring is one keep-out out.
 */
export function findFreePosition(
	preferred: Vec3,
	blockers: Iterable<Vec3>,
	radius: number,
	floorY: number,
	padding = 0,
	maxAttempts = 48
): Vec3 {
	const base = clampToFloor(preferred, floorY, radius);
	if (![...blockers].some((b) => spheresOverlap(base, b, radius, padding))) {
		return base;
	}
	const ringStep = minCenterDistance(radius, padding);
	for (let i = 1; i <= maxAttempts; i++) {
		const ang = i * 2.399963; // golden-angle spiral
		const rad = ringStep * Math.ceil(i / 6);
		const candidate = clampToFloor(
			{
				x: preferred.x + Math.cos(ang) * rad,
				y: preferred.y,
				z: preferred.z + Math.sin(ang) * rad
			},
			floorY,
			radius
		);
		if (![...blockers].some((b) => spheresOverlap(candidate, b, radius, padding))) {
			return candidate;
		}
	}
	return base;
}
