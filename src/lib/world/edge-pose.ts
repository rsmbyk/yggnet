import * as THREE from 'three';

export type Vec3 = { x: number; y: number; z: number };

export type EdgePose = {
	mid: Vec3;
	len: number;
	axis: Vec3;
	quaternion: [number, number, number, number];
};

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _tintBg = new THREE.Color();

/**
 * Pose a cylinder that sits on +Y, height 1, centered at the origin, onto
 * the segment `from → to`.
 */
export function edgePose(from: Vec3, to: Vec3): EdgePose {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const dz = to.z - from.z;
	const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.001;
	const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2, z: (from.z + to.z) / 2 };
	const axis = { x: dx / len, y: dy / len, z: dz / len };
	const yAxis = { x: 0, y: 1, z: 0 };
	const dot = yAxis.x * axis.x + yAxis.y * axis.y + yAxis.z * axis.z;
	let qx = 0;
	let qy = 0;
	let qz = 0;
	let qw = 1;
	if (dot < -0.999) {
		qx = 1;
		qw = 0;
	} else {
		const cx = yAxis.y * axis.z - yAxis.z * axis.y;
		const cy = yAxis.z * axis.x - yAxis.x * axis.z;
		const cz = yAxis.x * axis.y - yAxis.y * axis.x;
		qx = cx;
		qy = cy;
		qz = cz;
		qw = 1 + dot;
		const n = Math.sqrt(qx * qx + qy * qy + qz * qz + qw * qw) || 1;
		qx /= n;
		qy /= n;
		qz /= n;
		qw /= n;
	}
	return { mid, len, axis, quaternion: [qx, qy, qz, qw] };
}

/** Instance matrix for a unit-height Y cylinder covering `pose`. */
export function composeEdgeShaftMatrix(pose: EdgePose, out: THREE.Matrix4): THREE.Matrix4 {
	_pos.set(pose.mid.x, pose.mid.y, pose.mid.z);
	_quat.set(pose.quaternion[0], pose.quaternion[1], pose.quaternion[2], pose.quaternion[3]);
	_scale.set(1, pose.len, 1);
	return out.compose(_pos, _quat, _scale);
}

/**
 * Instance matrix for a unit-height Y cone whose center sits `inset` back
 * from `to` along the edge.
 */
export function composeEdgeArrowMatrix(
	to: Vec3,
	pose: EdgePose,
	arrowHeight: number,
	gapFraction: number,
	out: THREE.Matrix4
): THREE.Matrix4 {
	const inset = Math.max(arrowHeight / 2, pose.len * gapFraction);
	_pos.set(to.x - pose.axis.x * inset, to.y - pose.axis.y * inset, to.z - pose.axis.z * inset);
	_quat.set(pose.quaternion[0], pose.quaternion[1], pose.quaternion[2], pose.quaternion[3]);
	_scale.set(1, 1, 1);
	return out.compose(_pos, _quat, _scale);
}

/** Mix `hex` toward `bgHex` so instance colors can fake per-edge opacity. */
export function instanceTint(
	hex: string,
	opacity: number,
	bgHex: string,
	out: THREE.Color = new THREE.Color()
): THREE.Color {
	out.set(hex);
	const t = 1 - Math.min(1, Math.max(0, opacity));
	if (t <= 0) return out;
	_tintBg.set(bgHex);
	return out.lerp(_tintBg, t);
}

/** Next InstancedMesh capacity that fits `needed` without shrinking. */
export function instanceCapacity(needed: number, current: number): number {
	if (needed <= current) return current;
	let cap = Math.max(8, current);
	while (cap < needed) cap *= 2;
	return cap;
}
