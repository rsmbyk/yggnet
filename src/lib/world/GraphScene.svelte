<script lang="ts">
	import { T, useTask, useThrelte } from '@threlte/core';
	import { Billboard, OrbitControls, Text, interactivity } from '@threlte/extras';
	import { app } from '$lib/session/app.svelte';
	import { onDestroy } from 'svelte';
	import * as THREE from 'three';
	import { MOUSE } from 'three';
	import type { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
	import type { GraphNode } from '$lib/graph';
	import { defaultPositionFromTune, worldTune } from './world-tune.svelte';
	import { clampToFloor, resolveMoveAgainstNodes, snapToGrid } from './node-physics';
	import {
		interactionModeFromState,
		resolveNodeClick,
		type NodeClickAction
	} from './node-click';

	interactivity();

	const { camera, renderer, scene } = useThrelte();

	/** Live-tunable WORLD overrides (see World tune panel). */
	const tune = $derived(worldTune.values);
	const GROUND_SIZE = $derived(tune.groundSize);
	const GRID_MINOR = $derived(tune.gridMinor);
	const GRID_MAJOR = $derived(tune.gridMajor);
	const GRID_MEGA = $derived(tune.gridMega);
	const NODE_RADIUS = $derived(tune.nodeRadius);
	const NODE_COLOR = $derived(tune.nodeColor);
	const NODE_SELECTED_COLOR = $derived(tune.nodeSelectedColor);
	const NODE_HOVER_COLOR = $derived(tune.nodeHoverColor);
	const LABEL_DISTANCE = $derived(tune.labelDistance);
	const ARROW_HEIGHT = $derived(tune.arrowHeight);
	const ARROW_RADIUS = $derived(tune.arrowRadius);
	const ARROW_GAP_FRACTION = $derived(tune.arrowGapFraction);
	const EDGE_SHAFT_RADIUS = $derived(tune.shaftRadius);
	const EDGE_PREVIEW_SHAFT_RADIUS = $derived(tune.previewShaftRadius);
	const MAX_POLAR = $derived(tune.maxPolarAngle);
	const MIN_POLAR = $derived(tune.minPolarAngle);
	/** OrbitControls breaks at phi≈0 — never allow a tuned min polar of 0. */
	const SAFE_MIN_POLAR = $derived(Math.max(0.12, MIN_POLAR));
	const MIN_EYE_Y = $derived(tune.minEyeY);
	const MIN_DISTANCE_FLOOR = $derived(tune.minDistance);
	const CAM_MAX_DISTANCE = $derived(tune.maxDistance);
	const CAM_FOV = $derived(tune.fov);
	const CAM_NEAR = $derived(tune.near);
	const CAM_FAR = $derived(tune.far);
	const SCENE_BG = $derived(tune.background);
	const DEFAULT_VIEW_DIR = $derived(
		new THREE.Vector3(...defaultPositionFromTune(tune)).normalize()
	);
	/** Mount-only eye — must not track tune, or every slider write snaps the camera back. */
	const initialCameraPosition = defaultPositionFromTune(worldTune.values);
	const DRAG_THRESHOLD_PX = 5;
	const COLLISION_FLOOR_Y = $derived(tune.collisionFloorY);
	const COLLISION_PADDING = $derived(tune.collisionPadding);
	const COLLISION_SNAP_STEP = $derived(tune.collisionSnapStep);
	const PAN_SENSITIVITY = $derived(tune.panSensitivity);
	const ROTATE_SENSITIVITY = $derived(tune.rotateSensitivity);
	const DAMPING_FACTOR = $derived(tune.dampingFactor);
	const VIEW_MODE_MS = $derived(tune.viewModeTransitionMs);


	const dragPlane = new THREE.Plane();
	const connectPlane = new THREE.Plane();
	const raycaster = new THREE.Raycaster();
	const pointerNdc = new THREE.Vector2();
	const hitPoint = new THREE.Vector3();
	const _connectSource = new THREE.Vector3();
	const _connectNormal = new THREE.Vector3();
	const _snapPoint = new THREE.Vector3();

	let travelRaf = 0;
	/** Free end of the in-progress connect rubber-band (world space). */
	let connectCursor = $state<{ x: number; y: number; z: number } | null>(null);
	/** Node under the rubber-band tip (for Alt-drag release → complete). */
	let connectHoverNodeId = $state<string | null>(null);
	/**
	 * Keyboard modifier latch — Threlte/pointer events often omit altKey on Windows.
	 * Updated from window keydown/keyup so Alt+press-down is reliable.
	 */
	let modsHeld = { alt: false, ctrl: false, shift: false };
	let controls: ThreeOrbitControls | undefined = $state();
	let ground: THREE.Mesh | undefined = $state();
	/** 2D/3D camera tween — declared early so useTask can see it. */
	let viewModeAnimating = $state(false);
	let viewAnim: { mode: '2d' | '3d'; t0: number; duration: number } | null = null;

	/** One texture tile = one mega cell, with major/minor subdivisions from live tune. */
	function createGridTexture(): THREE.CanvasTexture {
		const v = worldTune.values;
		const size = Math.max(64, Math.floor(v.gridTextureSize));
		const minorCount = Math.max(1, Math.round(v.gridMega / v.gridMinor));
		const majorEvery = Math.max(1, Math.round(v.gridMajor / v.gridMinor));
		const step = size / minorCount;
		const canvas = document.createElement('canvas');
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = v.gridFill;
		ctx.fillRect(0, 0, size, size);

		ctx.strokeStyle = v.gridMinorColor;
		ctx.lineWidth = v.gridMinorLineWidth;
		ctx.beginPath();
		for (let i = 1; i < minorCount; i++) {
			if (i % majorEvery === 0) continue;
			const p = i * step + 0.5;
			ctx.moveTo(p, 0);
			ctx.lineTo(p, size);
			ctx.moveTo(0, p);
			ctx.lineTo(size, p);
		}
		ctx.stroke();

		ctx.strokeStyle = v.gridMajorColor;
		ctx.lineWidth = v.gridMajorLineWidth;
		ctx.beginPath();
		for (let i = majorEvery; i < minorCount; i += majorEvery) {
			const p = i * step + 0.5;
			ctx.moveTo(p, 0);
			ctx.lineTo(p, size);
			ctx.moveTo(0, p);
			ctx.lineTo(size, p);
		}
		ctx.stroke();

		ctx.strokeStyle = v.gridMegaColor;
		ctx.lineWidth = v.gridMegaLineWidth;
		ctx.beginPath();
		ctx.moveTo(0.5, 0);
		ctx.lineTo(0.5, size);
		ctx.moveTo(0, 0.5);
		ctx.lineTo(size, 0.5);
		ctx.stroke();

		const tex = new THREE.CanvasTexture(canvas);
		tex.colorSpace = THREE.SRGBColorSpace;
		tex.wrapS = THREE.RepeatWrapping;
		tex.wrapT = THREE.RepeatWrapping;
		tex.anisotropy = 8;
		tex.magFilter = THREE.LinearFilter;
		tex.minFilter = THREE.LinearMipmapLinearFilter;
		const tiles = v.groundSize / v.gridMega;
		tex.repeat.set(tiles, tiles);
		tex.needsUpdate = true;
		return tex;
	}

	const gridTiles = $derived(GROUND_SIZE / GRID_MEGA);
	/** Live refs — recreated when tune grid values change. */
	let gridTexture = createGridTexture();
	let groundMaterial = new THREE.MeshBasicMaterial({
		map: gridTexture,
		toneMapped: false
	});

	function attachGround(mesh: THREE.Mesh) {
		ground = mesh;
		rebuildGroundTexture();
		mesh.material = groundMaterial;
	}

	function rebuildGroundTexture() {
		const next = createGridTexture();
		gridTexture.dispose();
		gridTexture = next;
		groundMaterial.map = next;
		groundMaterial.needsUpdate = true;
		if (ground) ground.material = groundMaterial;
	}

	$effect(() => {
		// Rebuild grid when any grid/ground tune field changes.
		const v = worldTune.values;
		void v.groundSize;
		void v.gridMinor;
		void v.gridMajor;
		void v.gridMega;
		void v.gridTextureSize;
		void v.gridFill;
		void v.gridMinorColor;
		void v.gridMinorLineWidth;
		void v.gridMajorColor;
		void v.gridMajorLineWidth;
		void v.gridMegaColor;
		void v.gridMegaLineWidth;
		rebuildGroundTexture();
	});

	$effect(() => {
		const bg = SCENE_BG;
		const prevBg = scene.background;
		const prevClear = renderer.getClearColor(new THREE.Color());
		const prevAlpha = renderer.getClearAlpha();
		scene.background = new THREE.Color(bg);
		renderer.setClearColor(bg, 1);
		return () => {
			scene.background = prevBg;
			renderer.setClearColor(prevClear, prevAlpha);
		};
	});

	/** While true, skip app→controls camera pushes (avoids fighting wheel/orbit damping). */
	let camInteractiveUntil = 0;

	function markCamInteractive(ms = 400) {
		camInteractiveUntil = performance.now() + ms;
	}

	/**
	 * Keep the ground under the look target for an “infinite” floor, but scroll the
	 * texture by world position so 1 / 10 / 100 grid lines stay locked in world space.
	 *
	 * Important: do NOT re-clamp eye Y / minDistance every frame — that fights OrbitControls
	 * damping and makes pan/zoom feel like they die near the floor or at steep tilt.
	 */
	useTask(() => {
		if (!ground) return;
		const cam = camera.current;
		if (viewAnim) {
			tickViewModeAnim(performance.now());
		} else if (controls && !viewModeAnimating) {
			const flat = app.ui.viewMode === '2d';
			controls.minDistance = Math.max(0.05, MIN_DISTANCE_FLOOR);
			controls.maxDistance = CAM_MAX_DISTANCE;
			if (flat) {
				// 2D: manual top-down pose — don't use SAFE_MIN_POLAR (that leaves ~7° off vertical).
				controls.minPolarAngle = 0;
				controls.maxPolarAngle = Math.PI;
				if (pan) enforcePanPlaneLock(pan.plane, pan.planeLock, pan.eyeLock);
				enforce2dCamera();
			} else {
				controls.minPolarAngle = SAFE_MIN_POLAR;
				controls.maxPolarAngle = MAX_POLAR;
				if (pan) {
					enforcePanPlaneLock(pan.plane, pan.planeLock, pan.eyeLock);
				} else if (!Number.isFinite(controls.object.position.x + controls.object.position.y)) {
					clampCameraAboveGround();
					controls.update();
				}
			}
			syncCameraFromControls();
		}
		const tx = controls?.target.x ?? cam?.position.x ?? 0;
		const tz = controls?.target.z ?? cam?.position.z ?? 0;
		ground.position.x = tx;
		ground.position.z = tz;
		gridTexture.offset.x = tx / GRID_MEGA - gridTiles * 0.5;
		gridTexture.offset.y = -tz / GRID_MEGA - gridTiles * 0.5;
	});

	const nodes = $derived(Object.values(app.document.nodes));
	const edges = $derived(Object.values(app.document.edges));
	const overlayNodeSet = $derived(new Set(app.overlay.nodeIds));
	const overlayEdgeSet = $derived(new Set(app.overlay.edgeIds));
	const compareSeriesANodes = $derived(
		app.overlay.kind === 'compare' && app.overlay.seriesA
			? new Set(app.overlay.seriesA.nodeIds)
			: null
	);
	const compareSeriesBNodes = $derived(
		app.overlay.kind === 'compare' && app.overlay.seriesB
			? new Set(app.overlay.seriesB.nodeIds)
			: null
	);
	const compareSeriesAEdges = $derived(
		app.overlay.kind === 'compare' && app.overlay.seriesA
			? new Set(app.overlay.seriesA.edgeIds)
			: null
	);
	const compareSeriesBEdges = $derived(
		app.overlay.kind === 'compare' && app.overlay.seriesB
			? new Set(app.overlay.seriesB.edgeIds)
			: null
	);
	const selectedIds = $derived(new Set(app.selection.nodeIds));
	const dimOthers = $derived(app.overlay.dimOthers && app.overlay.kind !== 'none');
	const collapsedGroups = $derived(app.groupsCollapsed);

	const visibleNodes = $derived(
		nodes.filter((n) => {
			if (n.groupId && collapsedGroups.has(n.groupId)) return false;
			if (app.filters.hideFiltered && app.filters.tags.length > 0 && !app.nodePassesFilter(n.id)) {
				return false;
			}
			return true;
		})
	);

	const groupProxies = $derived.by(() => {
		const map = new Map<string, { id: string; x: number; y: number; z: number; count: number }>();
		for (const n of nodes) {
			if (!n.groupId || !collapsedGroups.has(n.groupId)) continue;
			const cur = map.get(n.groupId) ?? { id: n.groupId, x: 0, y: 0, z: 0, count: 0 };
			cur.x += n.position.x;
			cur.y += n.position.y;
			cur.z += n.position.z;
			cur.count += 1;
			map.set(n.groupId, cur);
		}
		return [...map.values()].map((g) => ({
			id: g.id,
			x: g.x / g.count,
			y: g.y / g.count,
			z: g.z / g.count,
			count: g.count
		}));
	});

	function nodeOpacity(id: string): number {
		if (!dimOthers) return 1;
		return overlayNodeSet.has(id) ? 1 : 0.22;
	}

	/**
	 * Label LOD: range from camera eye (zoom position in world) → node.
	 * Target→node alone ignores zoom-out; eye→node grows as you dolly away.
	 * For a node near the look-at, this is ≈ orbit distance (tilt-stable at the focus).
	 */
	function labelVisibleAt(pos: { x: number; y: number; z: number }): boolean {
		const eye = app.camera.eye;
		const dx = pos.x - eye.x;
		const dy = pos.y - eye.y;
		const dz = pos.z - eye.z;
		return dx * dx + dy * dy + dz * dz < LABEL_DISTANCE * LABEL_DISTANCE;
	}

	function edgeOpacity(id: string): number {
		if (!dimOthers) return 0.85;
		return overlayEdgeSet.has(id) ? 1 : 0.12;
	}

	/** Labels draw over edges/nodes (no depth occlusion). */
	function makeLabelPassThrough(ref: THREE.Object3D) {
		const mesh = ref as THREE.Mesh & { sync?: (cb?: () => void) => void };
		mesh.renderOrder = 10;
		const apply = () => {
			const m = mesh.material;
			if (!m) return;
			for (const mat of (Array.isArray(m) ? m : [m]) as THREE.Material[]) {
				mat.depthTest = false;
				mat.depthWrite = false;
			}
		};
		apply();
		if (typeof mesh.sync === 'function') {
			const prev = mesh.sync.bind(mesh);
			mesh.sync = (cb) =>
				prev(() => {
					apply();
					cb?.();
				});
		}
	}

	function nodeColor(id: string): string {
		if (selectedIds.has(id) || app.ui.connectFromId === id) return NODE_SELECTED_COLOR;
		if (hoveredNodeId === id) return NODE_HOVER_COLOR;
		if (app.overlay.kind === 'compare') {
			const inA = compareSeriesANodes?.has(id);
			const inB = compareSeriesBNodes?.has(id);
			if (inA && inB) return '#9a8a6a';
			if (inA) return '#2f9e8a';
			if (inB) return '#d4893a';
		}
		if (overlayNodeSet.has(id)) return '#2f9e8a';
		return NODE_COLOR;
	}

	function edgeColor(id: string): string {
		if (app.overlay.kind === 'compare') {
			const inA = compareSeriesAEdges?.has(id);
			const inB = compareSeriesBEdges?.has(id);
			if (inA && inB) return '#9a8a6a';
			if (inA) return '#3cb89a';
			if (inB) return '#e8a04a';
		}
		if (overlayEdgeSet.has(id)) return '#3cb89a';
		return '#4a5562';
	}

	function edgeObject(from: { x: number; y: number; z: number }, to: { x: number; y: number; z: number }) {
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
		return {
			mid,
			len,
			axis,
			quaternion: [qx, qy, qz, qw] as [number, number, number, number]
		};
	}

	function edgeArrowHead(
		to: { x: number; y: number; z: number },
		geo: ReturnType<typeof edgeObject>
	) {
		// Place arrow center at (fraction × edge length) back from the destination.
		const inset = Math.max(ARROW_HEIGHT / 2, geo.len * ARROW_GAP_FRACTION);
		return {
			x: to.x - geo.axis.x * inset,
			y: to.y - geo.axis.y * inset,
			z: to.z - geo.axis.z * inset
		};
	}

	/**
	 * Rubber-band free end while connecting: camera-facing plane through the source,
	 * snapping onto a nearby node when the ray grazes one.
	 */
	function updateConnectPreview(clientX: number, clientY: number) {
		const fromId = app.ui.connectFromId;
		if (!fromId || !camera.current) {
			connectCursor = null;
			connectHoverNodeId = null;
			return;
		}
		const source = app.document.nodes[fromId];
		if (!source) {
			connectCursor = null;
			connectHoverNodeId = null;
			return;
		}
		const canvas = renderer.domElement;
		const rect = canvas.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return;

		pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointerNdc, camera.current);

		_connectSource.set(source.position.x, source.position.y, source.position.z);

		const snapR = NODE_RADIUS * 1.85;
		const snapR2 = snapR * snapR;
		let bestSnap: { id: string; x: number; y: number; z: number } | null = null;
		let bestD = snapR2;
		for (const n of Object.values(app.document.nodes)) {
			if (n.id === fromId) continue;
			_snapPoint.set(n.position.x, n.position.y, n.position.z);
			const d = raycaster.ray.distanceSqToPoint(_snapPoint);
			if (d <= bestD) {
				bestD = d;
				bestSnap = { id: n.id, x: n.position.x, y: n.position.y, z: n.position.z };
			}
		}
		if (bestSnap) {
			connectHoverNodeId = bestSnap.id;
			connectCursor = { x: bestSnap.x, y: bestSnap.y, z: bestSnap.z };
			return;
		}

		connectHoverNodeId = null;
		_connectNormal.copy(camera.current.position).sub(_connectSource);
		if (_connectNormal.lengthSq() < 1e-8) _connectNormal.set(0, 1, 0);
		else _connectNormal.normalize();
		connectPlane.setFromNormalAndCoplanarPoint(_connectNormal, _connectSource);
		const hit = raycaster.ray.intersectPlane(connectPlane, hitPoint);
		if (!hit) return;
		if (hit.distanceTo(_connectSource) < 0.08) return;
		connectCursor = { x: hit.x, y: hit.y, z: hit.z };
	}

	/**
	 * Last camera pose written from OrbitControls. The app→controls effect skips
	 * when `app.camera` still matches this, so damping/orbit aren't fought.
	 */
	let lastSyncedFromControls: {
		distance: number;
		x: number;
		y: number;
		z: number;
	} | null = null;

	/** Scale-aware epsilon so large world coords don't spam setCamera every frame. */
	function cameraSyncEps(distance: number, target: { x: number; y: number; z: number }) {
		const scale = Math.max(
			1,
			distance,
			Math.abs(target.x),
			Math.abs(target.y),
			Math.abs(target.z)
		);
		return Math.max(0.02, scale * 1e-5);
	}

	const _offset = new THREE.Vector3();
	const _spherical = new THREE.Spherical();
	const _panDelta = new THREE.Vector3();
	const _panRight = new THREE.Vector3();
	const _panUp = new THREE.Vector3();
	const _panForward = new THREE.Vector3();

	function syncCameraFromControls() {
		if (!controls) return;
		const distance = controls.getDistance();
		const target = {
			x: controls.target.x,
			y: controls.target.y,
			z: controls.target.z
		};
		const eye = {
			x: controls.object.position.x,
			y: controls.object.position.y,
			z: controls.object.position.z
		};
		if (
			!Number.isFinite(distance) ||
			!Number.isFinite(eye.x + eye.y + eye.z) ||
			!Number.isFinite(target.x + target.y + target.z)
		) {
			clampCameraAboveGround();
			controls.update();
			return;
		}
		_offset.copy(controls.object.position).sub(controls.target);
		_spherical.setFromVector3(_offset);
		const panDeg = (_spherical.theta * 180) / Math.PI;
		const tiltDeg = 90 - (_spherical.phi * 180) / Math.PI;
		if (!Number.isFinite(panDeg) || !Number.isFinite(tiltDeg)) {
			clampCameraAboveGround();
			controls.update();
			return;
		}
		const cam = app.camera;
		const eps = cameraSyncEps(distance, target);
		const unchanged =
			Math.abs(distance - cam.distance) < eps &&
			Math.abs(target.x - cam.target.x) < eps &&
			Math.abs(target.y - cam.target.y) < eps &&
			Math.abs(target.z - cam.target.z) < eps &&
			Math.abs(eye.x - cam.eye.x) < eps &&
			Math.abs(eye.y - cam.eye.y) < eps &&
			Math.abs(eye.z - cam.eye.z) < eps &&
			Math.abs(panDeg - cam.panDeg) < 0.05 &&
			Math.abs(tiltDeg - cam.tiltDeg) < 0.05;
		if (unchanged) return;
		lastSyncedFromControls = {
			distance,
			x: target.x,
			y: target.y,
			z: target.z
		};
		app.setCamera({ distance, target, eye, panDeg, tiltDeg });
	}

	/** Emergency / reset pose repair — keep polar in range; do not fight live orbit/zoom. */
	function clampCameraAboveGround() {
		if (!controls) return;
		_offset.copy(controls.object.position).sub(controls.target);
		if (!Number.isFinite(_offset.x + _offset.y + _offset.z) || _offset.lengthSq() < 1e-12) {
			_offset.set(0, Math.max(MIN_DISTANCE_FLOOR, 1), 0);
		}
		_spherical.setFromVector3(_offset);
		if (!Number.isFinite(_spherical.phi) || !Number.isFinite(_spherical.theta)) {
			_spherical.phi = SAFE_MIN_POLAR;
			_spherical.theta = 0;
			_spherical.radius = Math.max(MIN_DISTANCE_FLOOR, 1);
		}
		if (_spherical.phi > MAX_POLAR) _spherical.phi = MAX_POLAR;
		if (_spherical.phi < SAFE_MIN_POLAR) _spherical.phi = SAFE_MIN_POLAR;
		const minDist = Math.max(0.05, MIN_DISTANCE_FLOOR);
		if (_spherical.radius < minDist) _spherical.radius = minDist;
		if (_spherical.radius > CAM_MAX_DISTANCE) _spherical.radius = CAM_MAX_DISTANCE;
		_spherical.makeSafe();
		if (_spherical.phi < SAFE_MIN_POLAR) _spherical.phi = SAFE_MIN_POLAR;
		_offset.setFromSpherical(_spherical);
		controls.object.position.copy(controls.target).add(_offset);
	}

	type DragPlane = 'xy' | 'yz' | 'xz';

	type DragState = {
		nodeId: string;
		pointerId: number;
		startX: number;
		startY: number;
		/** Locked axis value for the active drag plane (from grab start). */
		planeLock: { x: number; y: number; z: number };
		/** Position when the gesture began — RMB cancel restores this. */
		originPos: { x: number; y: number; z: number };
		plane: DragPlane;
		currentPos: { x: number; y: number; z: number };
		dragging: boolean;
		/** False in multi-select / connect — click intents only, no reposition. */
		allowMove: boolean;
		/** Resolved click intent if the gesture stays under the drag threshold. */
		click: NodeClickAction;
	};

	let drag = $state<DragState | null>(null);

	type PanState = {
		pointerId: number;
		plane: DragPlane;
		/** Target lock for the inactive axis (kept constant for the whole pan). */
		planeLock: { x: number; y: number; z: number };
		/** Eye lock for the inactive axis — pan must not change this component. */
		eyeLock: { x: number; y: number; z: number };
		lastHit: { x: number; y: number; z: number } | null;
		/** Screen fallback when the plane raycast is grazing. */
		lastScreen: { x: number; y: number } | null;
	};

	let pan = $state<PanState | null>(null);
	/** LMB orbit in progress — skip app→controls push while rotating. */
	let orbiting = $state(false);
	/** Node under the pointer — default cursor + hover color. */
	let hoveredNodeId = $state<string | null>(null);

	/** RMB press — click cancels multi-select; drag pans. */
	let rmbPress: { pointerId: number; x: number; y: number } | null = null;

	/** LMB press on empty canvas — click (no drag) clears selection / Ctrl+click starts connect. */
	let spacePress: { pointerId: number; x: number; y: number; ctrl: boolean; alt: boolean } | null =
		null;
	/** Set when a node mesh handled the same LMB press (Threlte hit). */
	let pointerHitNode = false;

	/** LMB drag empty space = orbit; RMB = custom pan (MIDDLE unused). */
	const ORBIT_MOUSE_BUTTONS = {
		LEFT: MOUSE.ROTATE,
		MIDDLE: -1 as unknown as THREE.MOUSE,
		RIGHT: -1 as unknown as THREE.MOUSE
	};

	type PointerLike = {
		nativeEvent?: PointerEvent;
		ctrlKey?: boolean;
		metaKey?: boolean;
		shiftKey?: boolean;
		altKey?: boolean;
		button?: number;
		pointerId?: number;
		clientX?: number;
		clientY?: number;
		stopPropagation?: () => void;
	};

	function eventMods(ev: PointerLike | PointerEvent) {
		const native = 'nativeEvent' in ev ? ev.nativeEvent : undefined;
		return {
			ctrl: Boolean(
				modsHeld.ctrl ||
					native?.ctrlKey ||
					('ctrlKey' in ev && ev.ctrlKey) ||
					native?.metaKey ||
					('metaKey' in ev && ev.metaKey)
			),
			shift: Boolean(modsHeld.shift || native?.shiftKey || ('shiftKey' in ev && ev.shiftKey)),
			alt: Boolean(modsHeld.alt || native?.altKey || ('altKey' in ev && ev.altKey))
		};
	}

	function beginConnect(nodeId: string, directed: boolean, clientX: number, clientY: number) {
		if (!app.document.nodes[nodeId]) return;
		app.setConnectFrom(nodeId, { directed });
		updateConnectPreview(clientX, clientY);
	}

	/** Ctrl → XY, Shift → YZ, else → XZ (ground). Ctrl wins if both. Locked to XZ in 2D. */
	function dragPlaneFromMods(ctrl: boolean, shift: boolean): DragPlane {
		if (app.ui.viewMode === '2d') return 'xz';
		if (ctrl) return 'xy';
		if (shift) return 'yz';
		return 'xz';
	}

	function clientCoords(ev: PointerLike): { x: number; y: number; pointerId: number } {
		const native = ev.nativeEvent;
		return {
			x: native?.clientX ?? ev.clientX ?? 0,
			y: native?.clientY ?? ev.clientY ?? 0,
			pointerId: native?.pointerId ?? ev.pointerId ?? 0
		};
	}

	function displayPosition(node: GraphNode): { x: number; y: number; z: number } {
		if (drag?.dragging && drag.nodeId === node.id) return drag.currentPos;
		return clampToFloor(node.position, COLLISION_FLOOR_Y, NODE_RADIUS);
	}

	/** Other node centers the dragged node must not penetrate. */
	function blockerPositions(exceptId: string): { x: number; y: number; z: number }[] {
		const out: { x: number; y: number; z: number }[] = [];
		for (const n of nodes) {
			if (n.id === exceptId) continue;
			out.push(clampToFloor(n.position, COLLISION_FLOOR_Y, NODE_RADIUS));
		}
		return out;
	}

	function constrainDragPos(
		proposed: { x: number; y: number; z: number },
		previous: { x: number; y: number; z: number },
		nodeId: string
	) {
		return resolveMoveAgainstNodes(
			proposed,
			previous,
			blockerPositions(nodeId),
			NODE_RADIUS,
			COLLISION_FLOOR_Y,
			COLLISION_PADDING
		);
	}

	function nodePos(id: string): { x: number; y: number; z: number } {
		const node = app.document.nodes[id];
		if (!node) return { x: 0, y: 0, z: 0 };
		return displayPosition(node);
	}

	function setDragPlane(plane: DragPlane, lock: { x: number; y: number; z: number }) {
		if (plane === 'xy') {
			dragPlane.set(new THREE.Vector3(0, 0, 1), -lock.z);
		} else if (plane === 'yz') {
			dragPlane.set(new THREE.Vector3(1, 0, 0), -lock.x);
		} else {
			dragPlane.set(new THREE.Vector3(0, 1, 0), -lock.y);
		}
	}

	function raycastPlane(
		clientX: number,
		clientY: number,
		plane: DragPlane,
		lock: { x: number; y: number; z: number }
	): { x: number; y: number; z: number } | null {
		if (!camera.current) return null;
		const canvas = renderer.domElement;
		const rect = canvas.getBoundingClientRect();
		if (rect.width === 0 || rect.height === 0) return null;
		pointerNdc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
		pointerNdc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
		raycaster.setFromCamera(pointerNdc, camera.current);
		setDragPlane(plane, lock);
		// Reject grazing rays — they shoot to infinity along the plane and yank the camera.
		if (Math.abs(raycaster.ray.direction.dot(dragPlane.normal)) < 0.08) return null;
		const hit = raycaster.ray.intersectPlane(dragPlane, hitPoint);
		if (!hit) return null;
		return { x: hit.x, y: hit.y, z: hit.z };
	}

	/** Freeze the axis that is not part of the active pan plane. */
	function enforcePanPlaneLock(
		plane: DragPlane,
		planeLock: { x: number; y: number; z: number },
		eyeLock: { x: number; y: number; z: number }
	) {
		if (!controls) return;
		const t = controls.target;
		const eye = controls.object.position;
		if (plane === 'xy') {
			t.z = planeLock.z;
			eye.z = eyeLock.z;
		} else if (plane === 'yz') {
			t.x = planeLock.x;
			eye.x = eyeLock.x;
		} else {
			t.y = planeLock.y;
			eye.y = eyeLock.y;
		}
	}

	/**
	 * Screen-space pan on one plane — same feel at any tilt/zoom.
	 * (Plane raycast pan slows to a crawl when the view grazes the plane.)
	 */
	function applyScreenPan(
		fromX: number,
		fromY: number,
		toX: number,
		toY: number,
		plane: DragPlane,
		planeLock: { x: number; y: number; z: number },
		eyeLock: { x: number; y: number; z: number }
	): boolean {
		if (!controls || !camera.current) return false;
		const canvas = renderer.domElement;
		const rect = canvas.getBoundingClientRect();
		if (rect.width < 1 || rect.height < 1) return false;
		const dist = Math.max(controls.getDistance(), 0.5);
		const fovRad = ((camera.current as THREE.PerspectiveCamera).fov * Math.PI) / 180;
		const worldPerPx = ((2 * dist * Math.tan(fovRad / 2)) / rect.height) * PAN_SENSITIVITY;
		const dxPx = toX - fromX;
		const dyPx = toY - fromY;
		camera.current.matrixWorld.extractBasis(_panRight, _panUp, _panForward);
		_panDelta.set(0, 0, 0);
		if (plane === 'xz') {
			_panRight.y = 0;
			_panForward.y = 0;
			if (_panRight.lengthSq() > 1e-8) _panRight.normalize();
			else _panRight.set(1, 0, 0);
			if (_panForward.lengthSq() > 1e-8) _panForward.normalize();
			else _panForward.set(0, 0, 1);
			_panDelta.addScaledVector(_panRight, -dxPx * worldPerPx);
			_panDelta.addScaledVector(_panForward, -dyPx * worldPerPx);
		} else if (plane === 'xy') {
			_panRight.z = 0;
			_panUp.z = 0;
			if (_panRight.lengthSq() > 1e-8) _panRight.normalize();
			else _panRight.set(1, 0, 0);
			if (_panUp.lengthSq() > 1e-8) _panUp.normalize();
			else _panUp.set(0, 1, 0);
			_panDelta.addScaledVector(_panRight, -dxPx * worldPerPx);
			_panDelta.addScaledVector(_panUp, dyPx * worldPerPx);
		} else {
			_panUp.x = 0;
			_panForward.x = 0;
			if (_panUp.lengthSq() > 1e-8) _panUp.normalize();
			else _panUp.set(0, 1, 0);
			if (_panForward.lengthSq() > 1e-8) _panForward.normalize();
			else _panForward.set(0, 0, 1);
			_panDelta.addScaledVector(_panForward, -dxPx * worldPerPx);
			_panDelta.addScaledVector(_panUp, dyPx * worldPerPx);
		}

		const t = controls.target;
		const eye = controls.object.position;
		let { x: dx, y: dy, z: dz } = _panDelta;

		// Floor stop only when the plane allows vertical motion (xy / yz).
		if ((plane === 'xy' || plane === 'yz') && dy < 0) {
			let scale = 1;
			if (t.y + dy < 0) {
				if (t.y <= 1e-6) return false;
				scale = Math.min(scale, t.y / -dy);
			}
			const dyScaled = dy * scale;
			if (eye.y + dyScaled < MIN_EYE_Y) {
				if (eye.y <= MIN_EYE_Y + 1e-6) return false;
				scale *= (eye.y - MIN_EYE_Y) / -dyScaled;
			}
			if (scale <= 1e-8) return false;
			dx *= scale;
			dy *= scale;
			dz *= scale;
		}

		if (Math.hypot(dx, dy, dz) < 1e-8) return false;
		t.x += dx;
		t.y += dy;
		t.z += dz;
		eye.x += dx;
		eye.y += dy;
		eye.z += dz;
		enforcePanPlaneLock(plane, planeLock, eyeLock);
		controls.update();
		return true;
	}

	function endNodePointer(pointerId: number, commit: boolean, ev?: PointerEvent) {
		const state = drag;
		if (!state || state.pointerId !== pointerId) return;
		drag = null;
		try {
			renderer.domElement.releasePointerCapture(pointerId);
		} catch {
			/* already released */
		}
		if (!commit) return;
		const mods = ev ? eventMods(ev) : { alt: app.ui.connectAltHeld, ctrl: false, shift: false };

		// Move only in idle (and only once past the drag threshold).
		if (state.allowMove && state.dragging) {
			const pos = clampToFloor(state.currentPos, COLLISION_FLOOR_Y, NODE_RADIUS);
			app.updateNode(state.nodeId, { position: pos });
			return;
		}
		if (state.click.kind === 'completeConnect' || app.ui.connectFromId) {
			app.tryConnectTo(state.nodeId, { altHeld: mods.alt });
			return;
		}
		if (state.click.kind === 'startConnect') {
			const from = app.selection.nodeIds[0] ?? state.nodeId;
			beginConnect(from, state.click.directed, state.startX, state.startY);
			return;
		}
		if (state.click.kind === 'select') {
			app.selectNodeWithModifiers(state.nodeId, state.click.mode);
		}
	}

	/** Drop any in-progress node LMB gesture without committing (RMB cancel move). */
	function cancelNodeGesture() {
		const state = drag;
		if (!state) return;
		const pid = state.pointerId;
		drag = null;
		try {
			renderer.domElement.releasePointerCapture(pid);
		} catch {
			/* already released */
		}
	}

	/** RMB while LMB-dragging — Windows often skips a separate button-2 pointerdown. */
	function maybeCancelMoveFromButtons(ev: PointerEvent) {
		if (!drag?.allowMove) return;
		if (!drag.dragging && Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < DRAG_THRESHOLD_PX) {
			return;
		}
		// bit 1 = LMB, bit 2 = RMB
		if ((ev.buttons & 2) === 0) return;
		cancelNodeGesture();
	}

	function endPanPointer(pointerId: number) {
		if (!pan || pan.pointerId !== pointerId) return;
		pan = null;
		try {
			renderer.domElement.releasePointerCapture(pointerId);
		} catch {
			/* already released */
		}
		if (controls) {
			// Don't clamp here — that rewrites tilt/pan after a low floor skim.
			controls.update();
			syncCameraFromControls();
		}
	}

	function onNodePointerDown(node: GraphNode, ev: PointerLike) {
		const button = ev.nativeEvent?.button ?? ev.button ?? 0;
		if (button !== 0) return;
		if (pan) return;
		ev.stopPropagation?.();
		orbiting = false;
		pointerHitNode = true;
		spacePress = null;
		const { x, y, pointerId } = clientCoords(ev);
		const mods = eventMods(ev);
		const mode = interactionModeFromState({
			connecting: app.ui.connectFromId !== null,
			multiSelectMode: app.ui.multiSelectMode,
			selectedNodeCount: app.selection.nodeIds.length
		});
		const click = resolveNodeClick(mods, mode);
		// Multi-select + connect: click intents only — no node reposition.
		const allowMove = mode === 'idle';
		const plane = dragPlaneFromMods(mods.ctrl, mods.shift);
		const origin = clampToFloor(node.position, COLLISION_FLOOR_Y, NODE_RADIUS);
		drag = {
			nodeId: node.id,
			pointerId,
			startX: x,
			startY: y,
			planeLock: { ...origin },
			originPos: { ...origin },
			plane,
			currentPos: { ...origin },
			dragging: false,
			allowMove,
			click
		};
		renderer.domElement.setPointerCapture(pointerId);
	}

	function startPanAt(ev: PointerEvent) {
		if (!controls) return;
		const mods = eventMods(ev);
		const plane = dragPlaneFromMods(mods.ctrl, mods.shift);
		const planeLock = {
			x: controls.target.x,
			y: controls.target.y,
			z: controls.target.z
		};
		const eyeLock = {
			x: controls.object.position.x,
			y: controls.object.position.y,
			z: controls.object.position.z
		};
		pan = {
			pointerId: ev.pointerId,
			plane,
			planeLock,
			eyeLock,
			lastHit: null,
			lastScreen: { x: ev.clientX, y: ev.clientY }
		};
		try {
			renderer.domElement.setPointerCapture(ev.pointerId);
		} catch {
			/* ignore */
		}
	}

	/** RMB: cancel node gesture / connect; click ends multi-select; drag pans. */
	function onRmbPointerDown(ev: PointerEvent) {
		if (ev.button !== 2) return;
		ev.preventDefault();
		ev.stopPropagation();
		if (drag) {
			cancelNodeGesture();
			rmbPress = null;
			return;
		}
		if (app.ui.connectFromId) {
			cancelConnectGesture();
			rmbPress = null;
			return;
		}
		rmbPress = { pointerId: ev.pointerId, x: ev.clientX, y: ev.clientY };
		markCamInteractive();
	}

	function onCanvasPointerMove(ev: PointerEvent) {
		maybeCancelMoveFromButtons(ev);
		if (app.ui.connectFromId) updateConnectPreview(ev.clientX, ev.clientY);

		// RMB press → pan once past threshold.
		if (rmbPress && ev.pointerId === rmbPress.pointerId && !pan) {
			if (Math.hypot(ev.clientX - rmbPress.x, ev.clientY - rmbPress.y) >= DRAG_THRESHOLD_PX) {
				startPanAt(ev);
				rmbPress = null;
			}
		}

		if (pan && ev.pointerId === pan.pointerId && controls) {
			const mods = eventMods(ev);
			const plane = dragPlaneFromMods(mods.ctrl, mods.shift);
			if (plane !== pan.plane) {
				pan = {
					...pan,
					plane,
					planeLock: {
						x: controls.target.x,
						y: controls.target.y,
						z: controls.target.z
					},
					eyeLock: {
						x: controls.object.position.x,
						y: controls.object.position.y,
						z: controls.object.position.z
					},
					lastHit: null,
					lastScreen: { x: ev.clientX, y: ev.clientY }
				};
			}
			if (pan.lastScreen) {
				applyScreenPan(
					pan.lastScreen.x,
					pan.lastScreen.y,
					ev.clientX,
					ev.clientY,
					pan.plane,
					pan.planeLock,
					pan.eyeLock
				);
			}
			pan = { ...pan, lastScreen: { x: ev.clientX, y: ev.clientY } };
			return;
		}

		if (!drag || ev.pointerId !== drag.pointerId) return;
		if (!drag.allowMove) return;

		const mods = eventMods(ev);
		const dx = ev.clientX - drag.startX;
		const dy = ev.clientY - drag.startY;
		if (!drag.dragging) {
			if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return;
			drag = { ...drag, dragging: true };
		}
		const plane = dragPlaneFromMods(mods.ctrl, mods.shift);
		if (plane !== drag.plane) {
			drag = {
				...drag,
				plane,
				planeLock: { ...drag.currentPos }
			};
		}
		const hit = raycastPlane(ev.clientX, ev.clientY, drag.plane, drag.planeLock);
		if (!hit) return;
		const snapped = snapToGrid(hit, drag.plane, COLLISION_SNAP_STEP, mods.alt);
		drag = {
			...drag,
			currentPos: constrainDragPos(snapped, drag.currentPos, drag.nodeId)
		};
	}

	function maybeClearSelectionOnSpaceClick(ev: PointerEvent) {
		const press = spacePress;
		spacePress = null;
		const hitNode = pointerHitNode;
		pointerHitNode = false;
		if (!press || press.pointerId !== ev.pointerId || hitNode) return;
		if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) >= DRAG_THRESHOLD_PX) return;
		// Ctrl+LMB on empty space: connect from current selection.
		if (press.ctrl) {
			app.beginConnectFromSelection({ directed: press.alt });
			updateConnectPreview(ev.clientX, ev.clientY);
			return;
		}
		// Sticky multi (2+) stays; single selection clears.
		if (app.ui.multiSelectMode && app.selection.nodeIds.length > 1) return;
		if (app.selection.nodeIds.length === 0 && app.selection.edgeIds.length === 0) return;
		app.clearAllSelection();
	}

	/** Capture: reset node-hit before Threlte / bubble handlers run. */
	function onSpacePointerDownCapture(ev: PointerEvent) {
		if (ev.button !== 0) return;
		pointerHitNode = false;
	}

	function onSpacePointerDown(ev: PointerEvent) {
		if (ev.button !== 0) return;
		if (pan || drag) return;
		const mods = eventMods(ev);
		const press = {
			pointerId: ev.pointerId,
			x: ev.clientX,
			y: ev.clientY,
			ctrl: mods.ctrl,
			alt: mods.alt
		};
		spacePress = press;
		// Threlte node hits may run before or after this listener — settle after the event.
		queueMicrotask(() => {
			if (pointerHitNode && spacePress === press) spacePress = null;
		});
	}

	function maybeCancelMultiOnRmbClick(ev: PointerEvent) {
		const press = rmbPress;
		rmbPress = null;
		if (!press || press.pointerId !== ev.pointerId) return;
		if (Math.hypot(ev.clientX - press.x, ev.clientY - press.y) >= DRAG_THRESHOLD_PX) return;
		if (app.ui.multiSelectMode || app.selection.nodeIds.length > 1) {
			app.clearAllSelection();
		}
	}

	function onCanvasPointerUp(ev: PointerEvent) {
		endPanPointer(ev.pointerId);
		endNodePointer(ev.pointerId, true, ev);
		if (ev.button === 2) maybeCancelMultiOnRmbClick(ev);
		else maybeClearSelectionOnSpaceClick(ev);
	}

	function onCanvasPointerCancel(ev: PointerEvent) {
		endPanPointer(ev.pointerId);
		endNodePointer(ev.pointerId, false, ev);
		spacePress = null;
		rmbPress = null;
		pointerHitNode = false;
	}

	function onModifierKey(ev: KeyboardEvent) {
		const down = ev.type === 'keydown';
		if (ev.key === 'Alt') {
			modsHeld.alt = down;
			// Stop the browser menu bar from stealing Alt so pointerdown still sees it held.
			if (down && !ev.repeat) ev.preventDefault();
			if (app.ui.connectFromId) app.setConnectAltHeld(down);
		} else if (ev.key === 'Control' || ev.key === 'Meta') {
			modsHeld.ctrl = down;
		} else if (ev.key === 'Shift') {
			modsHeld.shift = down;
		}
	}

	function onWindowBlur() {
		modsHeld = { alt: false, ctrl: false, shift: false };
		if (app.ui.connectFromId) app.setConnectAltHeld(false);
	}

	/** Drop connect mode. */
	function cancelConnectGesture() {
		if (!app.ui.connectFromId) return;
		app.setConnectFrom(null);
		connectCursor = null;
		connectHoverNodeId = null;
	}

	$effect(() => {
		if (!app.ui.connectFromId) {
			connectCursor = null;
			connectHoverNodeId = null;
		}
	});

	/** Don't orbit while a node gesture, RMB pan, 2D mode, or view-mode tween owns the view. */
	$effect(() => {
		if (!controls) return;
		controls.enableRotate =
			app.ui.viewMode === '3d' && !drag && !pan && !viewModeAnimating;
	});

	/** Grab over empty space; default arrow over nodes. */
	function setCanvasCursor(kind: 'grab' | 'grabbing' | 'default') {
		const canvas = renderer.domElement;
		canvas.style.cursor = kind;
		if (canvas.parentElement) canvas.parentElement.style.cursor = kind;
	}

	function syncIdleCursor() {
		if (pan || orbiting || (drag?.dragging && drag.allowMove)) {
			if (controls) controls.cursorStyle = 'grab';
			setCanvasCursor('grabbing');
			return;
		}
		if (hoveredNodeId || drag || app.ui.viewMode === '2d') {
			// Over / pressing a node, or 2D (no LMB orbit) — normal arrow.
			if (controls) controls.cursorStyle = 'auto';
			setCanvasCursor('default');
			return;
		}
		if (controls) controls.cursorStyle = 'grab';
		setCanvasCursor('grab');
	}

	$effect(() => {
		void hoveredNodeId;
		void orbiting;
		void pan;
		void drag;
		void app.ui.viewMode;
		syncIdleCursor();
	});

	$effect(() => {
		if (app.ui.viewMode === '2d' && orbiting) orbiting = false;
	});

	function onNodePointerEnter(id: string) {
		hoveredNodeId = id;
	}

	function onNodePointerLeave(id: string) {
		if (hoveredNodeId === id) hoveredNodeId = null;
	}

	$effect(() => {
		const canvas = renderer.domElement;
		const preventAux = (ev: MouseEvent) => {
			if (ev.button === 1 || ev.button === 2) ev.preventDefault();
		};
		const onOrbitDown = (ev: PointerEvent) => {
			if (ev.button !== 0) return;
			if (app.ui.viewMode === '2d') return;
			if (drag || pan || hoveredNodeId) return;
			orbiting = true;
			setCanvasCursor('grabbing');
			markCamInteractive();
		};
		const onWheel = () => {
			markCamInteractive(600);
		};
		const onRmbCapture = (ev: PointerEvent) => {
			// Capture phase — fire even when LMB owns pointer capture on the canvas.
			if (ev.button !== 2) return;
			if (!drag) return;
			ev.preventDefault();
			ev.stopPropagation();
			cancelNodeGesture();
		};
		const onOrbitUp = (ev: PointerEvent) => {
			if (ev.button === 0 || ev.type === 'pointercancel') {
				orbiting = false;
				syncIdleCursor();
			}
		};
		const onContextMenu = (ev: Event) => {
			ev.preventDefault();
		};
		canvas.addEventListener('pointerdown', onSpacePointerDownCapture, true);
		canvas.addEventListener('pointerdown', onRmbCapture, true);
		window.addEventListener('pointerdown', onRmbCapture, true);
		canvas.addEventListener('pointerdown', onRmbPointerDown);
		canvas.addEventListener('pointerdown', onOrbitDown);
		canvas.addEventListener('pointerdown', onSpacePointerDown);
		canvas.addEventListener('wheel', onWheel, { passive: true });
		canvas.addEventListener('mousedown', preventAux);
		canvas.addEventListener('auxclick', preventAux);
		canvas.addEventListener('contextmenu', onContextMenu);
		window.addEventListener('pointerup', onOrbitUp);
		window.addEventListener('pointercancel', onOrbitUp);
		window.addEventListener('pointermove', onCanvasPointerMove);
		window.addEventListener('pointerup', onCanvasPointerUp);
		window.addEventListener('pointercancel', onCanvasPointerCancel);
		window.addEventListener('keydown', onModifierKey);
		window.addEventListener('keyup', onModifierKey);
		window.addEventListener('blur', onWindowBlur);
		return () => {
			canvas.removeEventListener('pointerdown', onSpacePointerDownCapture, true);
			canvas.removeEventListener('pointerdown', onRmbCapture, true);
			window.removeEventListener('pointerdown', onRmbCapture, true);
			canvas.removeEventListener('pointerdown', onRmbPointerDown);
			canvas.removeEventListener('pointerdown', onOrbitDown);
			canvas.removeEventListener('pointerdown', onSpacePointerDown);
			canvas.removeEventListener('wheel', onWheel);
			canvas.removeEventListener('mousedown', preventAux);
			canvas.removeEventListener('auxclick', preventAux);
			canvas.removeEventListener('contextmenu', onContextMenu);
			window.removeEventListener('pointerup', onOrbitUp);
			window.removeEventListener('pointercancel', onOrbitUp);
			window.removeEventListener('pointermove', onCanvasPointerMove);
			window.removeEventListener('pointerup', onCanvasPointerUp);
			window.removeEventListener('pointercancel', onCanvasPointerCancel);
			window.removeEventListener('keydown', onModifierKey);
			window.removeEventListener('keyup', onModifierKey);
			window.removeEventListener('blur', onWindowBlur);
		};
	});

	$effect(() => {
		const t = app.camera.target;
		const d = app.camera.distance;
		if (!controls || app.directions.traveling || pan || orbiting || viewModeAnimating) return;
		if (performance.now() < camInteractiveUntil) return;
		const synced = lastSyncedFromControls;
		const eps = cameraSyncEps(d, t);
		if (
			synced &&
			Math.abs(d - synced.distance) < eps &&
			Math.abs(t.x - synced.x) < eps &&
			Math.abs(t.y - synced.y) < eps &&
			Math.abs(t.z - synced.z) < eps
		) {
			return;
		}
		const sameTarget =
			Math.abs(controls.target.x - t.x) < eps &&
			Math.abs(controls.target.y - t.y) < eps &&
			Math.abs(controls.target.z - t.z) < eps;
		const sameDist = Math.abs(controls.getDistance() - d) < Math.max(0.05, eps);
		if (sameTarget && sameDist) return;
		const offset = controls.object.position.clone().sub(controls.target);
		if (!sameDist) {
			const len = offset.length();
			if (len > 1e-6) offset.multiplyScalar(d / len);
			else offset.set(0, d, 0);
		}
		controls.target.set(t.x, t.y, t.z);
		controls.object.position.copy(controls.target).add(offset);
		clampCameraAboveGround();
		controls.update();
	});

	let appliedOrbitEpoch = 0;
	let appliedViewModeEpoch = 0;
	/** Which mode the in-flight tween is heading toward (for mash retarget). */
	let viewModeAnimTarget: '2d' | '3d' | null = null;
	let viewModeDampingRestore: boolean | null = null;
	/** 2D screen axes: world +X horizontal, world −Z vertical on screen. */
	const VIEW2D_UP = new THREE.Vector3(0, 0, -1);
	const _fromEye = new THREE.Vector3();
	const _toEye = new THREE.Vector3();
	const _fromTarget = new THREE.Vector3();
	const _toTarget = new THREE.Vector3();
	const _fromUp = new THREE.Vector3();
	const _toUp = new THREE.Vector3();
	const _fromQuat = new THREE.Quaternion();
	const _toQuat = new THREE.Quaternion();
	const _animQuat = new THREE.Quaternion();
	const _lookMat = new THREE.Matrix4();

	function smootherstep(u: number): number {
		const x = Math.min(1, Math.max(0, u));
		return x * x * x * (x * (x * 6 - 15) + 10);
	}

	function quatLookAt(
		eye: THREE.Vector3,
		target: THREE.Vector3,
		up: THREE.Vector3,
		out: THREE.Quaternion
	) {
		_lookMat.lookAt(eye, target, up);
		out.setFromRotationMatrix(_lookMat);
	}

	function clampViewDistance(dist?: number): number {
		const minD = Math.max(0.05, MIN_DISTANCE_FLOOR);
		const maxD = CAM_MAX_DISTANCE;
		let d = dist ?? controls?.getDistance() ?? app.camera.distance;
		if (!Number.isFinite(d) || d < minD) d = Math.max(app.camera.distance, minD);
		return Math.min(maxD, Math.max(minD, d));
	}

	/** True top-down on the XZ plane — eye on +Y, up −Z for map-style screen axes. */
	function apply2dCameraPose(targetX: number, targetZ: number, distance?: number) {
		if (!controls) return;
		const d = clampViewDistance(distance);
		controls.target.set(targetX, 0, targetZ);
		controls.object.position.set(targetX, d, targetZ);
		controls.object.up.copy(VIEW2D_UP);
		controls.object.lookAt(targetX, 0, targetZ);
	}

	function enforce2dCamera() {
		if (!controls) return;
		apply2dCameraPose(controls.target.x, controls.target.z);
	}

	/** Capture 3D orbit only from a settled non-flat Y-up pose. */
	function captureLast3dOrbitIfSettled() {
		if (!controls) return;
		if (controls.object.up.y < 0.85) return;
		const eye = controls.object.position;
		const t = controls.target;
		const ox = eye.x - t.x;
		const oy = eye.y - t.y;
		const oz = eye.z - t.z;
		if (!Number.isFinite(ox + oy + oz)) return;
		const len = Math.hypot(ox, oy, oz);
		if (len < 1e-6 || oy / len > 0.98) return;
		app.saveLast3dOrbit({ x: ox, y: oy, z: oz });
	}

	function computeViewModeEndPose(mode: '2d' | '3d', tx: number, tz: number) {
		const d = clampViewDistance();
		_toTarget.set(tx, 0, tz);
		if (mode === '2d') {
			_toEye.set(tx, d, tz);
			_toUp.copy(VIEW2D_UP);
		} else {
			const off = app.last3dOrbit.offset;
			_offset.set(off.x, off.y, off.z);
			if (_offset.lengthSq() < 1e-12) {
				_offset.copy(DEFAULT_VIEW_DIR).multiplyScalar(d);
			} else {
				_offset.multiplyScalar(d / _offset.length());
			}
			_toEye.copy(_toTarget).add(_offset);
			_toUp.set(0, 1, 0);
		}
		quatLookAt(_toEye, _toTarget, _toUp, _toQuat);
	}

	function beginViewModeAnimGate() {
		if (!controls) return;
		controls.minPolarAngle = 0;
		controls.maxPolarAngle = Math.PI;
		if (viewModeDampingRestore == null) {
			viewModeDampingRestore = controls.enableDamping;
		}
		controls.enableDamping = false;
		controls.enableRotate = false;
		orbiting = false;
	}

	function completeViewModeAnim(mode: '2d' | '3d') {
		if (!controls) return;
		controls.object.position.copy(_toEye);
		controls.target.copy(_toTarget);
		controls.object.up.copy(_toUp);
		controls.object.quaternion.copy(_toQuat);
		if (mode === '2d') {
			controls.minPolarAngle = 0;
			controls.maxPolarAngle = Math.PI;
		} else {
			controls.minPolarAngle = SAFE_MIN_POLAR;
			controls.maxPolarAngle = MAX_POLAR;
		}
		if (viewModeDampingRestore != null) {
			controls.enableDamping = viewModeDampingRestore;
			viewModeDampingRestore = null;
		}
		viewAnim = null;
		viewModeAnimating = false;
		viewModeAnimTarget = null;
		syncCameraFromControls();
	}

	let viewAnimFromTargetX = 0;
	let viewAnimFromTargetZ = 0;

	function tickViewModeAnim(now: number) {
		if (!viewAnim || !controls) return;
		const { mode, t0, duration } = viewAnim;
		const u = Math.min(1, (now - t0) / duration);
		const e = smootherstep(u);
		controls.object.position.lerpVectors(_fromEye, _toEye, e);
		controls.target.set(
			viewAnimFromTargetX + (_toTarget.x - viewAnimFromTargetX) * e,
			0,
			viewAnimFromTargetZ + (_toTarget.z - viewAnimFromTargetZ) * e
		);
		_animQuat.slerpQuaternions(_fromQuat, _toQuat, e);
		controls.object.quaternion.copy(_animQuat);
		controls.object.up.set(0, 1, 0).applyQuaternion(_animQuat).normalize();
		if (u < 1) return;
		completeViewModeAnim(mode);
	}

	/** Tween eye pose + quaternion — 2D ends straight down on the grid plane. */
	function animateViewModeTransition(mode: '2d' | '3d') {
		if (!controls) return;
		if (viewModeAnimating && viewModeAnimTarget === mode) return;

		if (mode === '2d') captureLast3dOrbitIfSettled();

		const tx = controls.target.x;
		const tz = controls.target.z;
		viewAnimFromTargetX = tx;
		viewAnimFromTargetZ = tz;

		_fromEye.copy(controls.object.position);
		_fromTarget.copy(controls.target);
		_fromUp.copy(controls.object.up);
		if (_fromUp.lengthSq() < 1e-8) _fromUp.set(0, 1, 0);
		quatLookAt(_fromEye, _fromTarget, _fromUp, _fromQuat);

		computeViewModeEndPose(mode, tx, tz);
		if (_fromQuat.dot(_toQuat) < 0) {
			_toQuat.x *= -1;
			_toQuat.y *= -1;
			_toQuat.z *= -1;
			_toQuat.w *= -1;
		}

		const reduceMotion =
			typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
		const duration = reduceMotion ? 0 : Math.max(0, VIEW_MODE_MS);

		viewModeAnimTarget = mode;
		beginViewModeAnimGate();
		markCamInteractive(duration + 80);

		if (duration < 1) {
			viewModeAnimating = true;
			completeViewModeAnim(mode);
			return;
		}

		viewModeAnimating = true;
		viewAnim = { mode, t0: performance.now(), duration };
	}

	$effect(() => {
		const epoch = app.viewModeEpoch;
		if (!controls || epoch === 0 || epoch === appliedViewModeEpoch) return;
		appliedViewModeEpoch = epoch;
		animateViewModeTransition(app.ui.viewMode);
	});

	$effect(() => {
		const epoch = app.cameraOrbitEpoch;
		if (!controls || epoch === 0 || epoch === appliedOrbitEpoch) return;
		appliedOrbitEpoch = epoch;
		const d = app.camera.distance;
		const t = controls.target;
		if (app.ui.viewMode === '2d') {
			animateViewModeTransition('2d');
			return;
		}
		const dir = DEFAULT_VIEW_DIR;
		controls.object.up.set(0, 1, 0);
		controls.object.position.set(t.x + dir.x * d, t.y + dir.y * d, t.z + dir.z * d);
		clampCameraAboveGround();
		controls.update();
		syncCameraFromControls();
	});

	$effect(() => {
		if (!app.directions.traveling) {
			if (travelRaf) cancelAnimationFrame(travelRaf);
			travelRaf = 0;
			return;
		}
		let last = performance.now();
		const tick = (now: number) => {
			const dt = (now - last) / 1000;
			last = now;
			const next = app.directions.travelProgress + dt * 0.15;
			if (next >= 1) {
				app.setTravelProgress(1);
				app.stopTravel();
				return;
			}
			app.setTravelProgress(next);
			const pos = app.travelPosition();
			if (pos && controls) {
				controls.target.set(pos.x, 0, pos.z);
				controls.object.position.set(pos.x + 6, 8, pos.z + 6);
				controls.update();
				app.setCamera({ target: { x: pos.x, y: 0, z: pos.z }, distance: 12 });
			}
			travelRaf = requestAnimationFrame(tick);
		};
		travelRaf = requestAnimationFrame(tick);
		return () => {
			if (travelRaf) cancelAnimationFrame(travelRaf);
		};
	});

	onDestroy(() => {
		if (travelRaf) cancelAnimationFrame(travelRaf);
		viewAnim = null;
		gridTexture.dispose();
		groundMaterial.dispose();
	});
</script>

<T.PerspectiveCamera
	makeDefault
	position={initialCameraPosition}
	fov={CAM_FOV}
	near={CAM_NEAR}
	far={CAM_FAR}
>
	<OrbitControls
		bind:ref={controls}
		enableDamping
		dampingFactor={DAMPING_FACTOR}
		enableRotate={true}
		enablePan={false}
		enableZoom={true}
		rotateSpeed={ROTATE_SENSITIVITY}
		screenSpacePanning={false}
		mouseButtons={ORBIT_MOUSE_BUTTONS}
		cursorStyle="grab"
		minDistance={0.01}
		maxDistance={CAM_MAX_DISTANCE}
		minPolarAngle={SAFE_MIN_POLAR}
		maxPolarAngle={MAX_POLAR}
	/>
</T.PerspectiveCamera>

<T.AmbientLight intensity={0.95} />
<T.DirectionalLight position={[10, 18, 6]} intensity={1.1} />

<T.Mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} oncreate={attachGround}>
	<T.PlaneGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
</T.Mesh>

{#each visibleNodes as node (node.id)}
	{@const opacity = nodeOpacity(node.id)}
	{@const color = nodeColor(node.id)}
	{@const pos = displayPosition(node)}
	<T.Mesh
		position={[pos.x, pos.y, pos.z]}
		onpointerenter={() => onNodePointerEnter(node.id)}
		onpointerleave={() => onNodePointerLeave(node.id)}
		onpointerdown={(ev: PointerLike) => onNodePointerDown(node, ev)}
	>
		<T.SphereGeometry args={[NODE_RADIUS, 24, 24]} />
		<T.MeshStandardMaterial {color} transparent {opacity} roughness={0.45} metalness={0.15} />
	</T.Mesh>
	{#if labelVisibleAt(pos)}
		<!-- Billboard at node center; local +Y = camera/screen up so the label stays on top at any tilt. -->
		<Billboard position={[pos.x, pos.y, pos.z]}>
			<Text
				position={[0, NODE_RADIUS + 0.5, 0]}
				text={node.label}
				fontSize={0.45}
				anchorX="center"
				anchorY="middle"
				color="#d7dde5"
				outlineWidth={0.02}
				outlineColor="#1c242e"
				oncreate={makeLabelPassThrough}
			/>
		</Billboard>
	{/if}
{/each}

{#each groupProxies as g (g.id)}
	{@const gPos = { x: g.x, y: g.y, z: g.z }}
	<T.Mesh position={[g.x, g.y, g.z]}>
		<T.SphereGeometry args={[0.9, 20, 20]} />
		<T.MeshStandardMaterial color="#8a7a5a" roughness={0.5} />
	</T.Mesh>
	{#if labelVisibleAt(gPos)}
		<Billboard position={[g.x, g.y, g.z]}>
			<Text
				position={[0, 1.3, 0]}
				text={`Group (${g.count})`}
				fontSize={0.4}
				anchorX="center"
				anchorY="middle"
				color="#e6dcc8"
				oncreate={makeLabelPassThrough}
			/>
		</Billboard>
	{/if}
{/each}

{#each edges as edge (edge.id)}
	{@const fromPos = nodePos(edge.from)}
	{@const toPos = nodePos(edge.to)}
	{#if app.document.nodes[edge.from] && app.document.nodes[edge.to]}
		{@const geo = edgeObject(fromPos, toPos)}
		{@const hidden =
			app.filters.hideFiltered &&
			app.filters.tags.length > 0 &&
			(!app.nodePassesFilter(edge.from) || !app.nodePassesFilter(edge.to))}
		{#if !hidden}
			{@const color = edgeColor(edge.id)}
			{@const opacity = edgeOpacity(edge.id)}
			<T.Mesh position={[geo.mid.x, geo.mid.y, geo.mid.z]} quaternion={geo.quaternion}>
				<T.CylinderGeometry args={[EDGE_SHAFT_RADIUS, EDGE_SHAFT_RADIUS, geo.len, 8]} />
				<T.MeshStandardMaterial {color} transparent {opacity} roughness={0.45} metalness={0.15} />
			</T.Mesh>
			{#if edge.directed}
				{@const arrow = edgeArrowHead(toPos, geo)}
				<T.Mesh position={[arrow.x, arrow.y, arrow.z]} quaternion={geo.quaternion}>
					<!-- radius, height, radialSegments, heightSegments, openEnded=false → capped solid cone -->
					<T.ConeGeometry args={[ARROW_RADIUS, ARROW_HEIGHT, 32, 1, false]} />
					<T.MeshStandardMaterial
						{color}
						transparent={opacity < 1}
						{opacity}
						roughness={0.45}
						metalness={0.15}
						side={THREE.DoubleSide}
					/>
				</T.Mesh>
			{/if}
		{/if}
	{/if}
{/each}

{#if app.ui.connectFromId && connectCursor}
	{@const fromPos = nodePos(app.ui.connectFromId)}
	{@const toPos = connectCursor}
	{@const geo = edgeObject(fromPos, toPos)}
	{#if geo.len > 0.1}
		{@const previewColor = app.ui.connectDirected ? '#0b6e7a' : '#3cb89a'}
		{@const previewOpacity = 0.9}
		<T.Mesh position={[geo.mid.x, geo.mid.y, geo.mid.z]} quaternion={geo.quaternion}>
			<T.CylinderGeometry
				args={[EDGE_PREVIEW_SHAFT_RADIUS, EDGE_PREVIEW_SHAFT_RADIUS, geo.len, 8]}
			/>
			<T.MeshStandardMaterial
				color={previewColor}
				transparent
				opacity={previewOpacity}
				roughness={0.4}
				metalness={0.2}
				depthWrite={false}
			/>
		</T.Mesh>
		{#if app.ui.connectDirected}
			{@const arrow = edgeArrowHead(toPos, geo)}
			<T.Mesh position={[arrow.x, arrow.y, arrow.z]} quaternion={geo.quaternion}>
				<T.ConeGeometry args={[ARROW_RADIUS * 1.1, ARROW_HEIGHT, 32, 1, false]} />
				<T.MeshStandardMaterial
					color={previewColor}
					transparent
					opacity={previewOpacity}
					roughness={0.4}
					metalness={0.2}
					side={THREE.DoubleSide}
					depthWrite={false}
				/>
			</T.Mesh>
		{/if}
	{/if}
{/if}

{#if app.directions.traveling}
	{@const pos = app.travelPosition()}
	{#if pos}
		<T.Mesh position={[pos.x, pos.y, pos.z]}>
			<T.SphereGeometry args={[0.28, 16, 16]} />
			<T.MeshStandardMaterial color="#e8c56a" emissive="#6a5420" emissiveIntensity={0.25} />
		</T.Mesh>
	{/if}
{/if}
