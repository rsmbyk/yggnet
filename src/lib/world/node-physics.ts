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
 * Slot count on search ring `ring` (1-based): six more plots each ring.
 */
export function hexRingSlotCount(ring: number): number {
	return 6 * ring;
}

/**
 * Candidate on ring `ring` (1-based), slot `slot` (0 … 6k−1).
 * Equal angles, aligned to +X so spokes stay shared across rings.
 */
export function hexRingPosition(
	preferred: Vec3,
	ring: number,
	slot: number,
	ringStep: number
): Vec3 {
	const n = hexRingSlotCount(ring);
	const ang = (slot * 2 * Math.PI) / n;
	const rad = ringStep * ring;
	return {
		x: preferred.x + Math.cos(ang) * rad,
		y: preferred.y,
		z: preferred.z + Math.sin(ang) * rad
	};
}

/**
 * Find a floor-resting position near `preferred` that does not overlap blockers.
 * Search rings are spaced by `minCenterDistance`; ring k has 6k equally spaced slots.
 */
export function findFreePosition(
	preferred: Vec3,
	blockers: Iterable<Vec3>,
	radius: number,
	floorY: number,
	padding = 0
): Vec3 {
	const others = [...blockers];
	const base = clampToFloor(preferred, floorY, radius);
	if (!others.some((b) => spheresOverlap(base, b, radius, padding))) {
		return base;
	}
	const ringStep = minCenterDistance(radius, padding);
	if (!(ringStep > 0)) return base;
	for (let ring = 1; ; ring++) {
		const n = hexRingSlotCount(ring);
		for (let slot = 0; slot < n; slot++) {
			const candidate = clampToFloor(
				hexRingPosition(preferred, ring, slot, ringStep),
				floorY,
				radius
			);
			if (!others.some((b) => spheresOverlap(candidate, b, radius, padding))) {
				return candidate;
			}
		}
	}
}
