/**
 * Live-tunable overrides for every `WORLD` field.
 * Defaults come from `world-config.ts`. Save writes that file (dev server only).
 */
import { WORLD } from './world-config';

export type WorldTuneValues = {
	groundSize: number;
	gridMinor: number;
	gridMajor: number;
	gridMega: number;
	gridTextureSize: number;
	gridFill: string;
	gridMinorColor: string;
	gridMinorLineWidth: number;
	gridMajorColor: string;
	gridMajorLineWidth: number;
	gridMegaColor: string;
	gridMegaLineWidth: number;
	background: string;
	nodeRadius: number;
	defaultNodeY: number;
	nodeColor: string;
	nodeSelectedColor: string;
	nodeHoverColor: string;
	defaultDistance: number;
	minDistance: number;
	maxDistance: number;
	near: number;
	far: number;
	fov: number;
	/** Polar elevation from +Y (degrees). 50 ≈ current isometric default. */
	viewElevationDeg: number;
	defaultTargetX: number;
	defaultTargetY: number;
	defaultTargetZ: number;
	minPolarAngle: number;
	maxPolarAngle: number;
	/** Documented camera.minHeight (design note; eye floor uses minEyeY). */
	minHeight: number;
	/** Runtime eye Y floor used by orbit/pan clamps. */
	minEyeY: number;
	labelDistance: number;
	shaftRadius: number;
	previewShaftRadius: number;
	arrowHeight: number;
	arrowRadius: number;
	arrowGapFraction: number;
	/** MMB pan: fraction of raycast delta (1 = 1:1 with cursor). */
	panSensitivity: number;
	/** RMB orbit rotateSpeed (OrbitControls default is 1). */
	rotateSensitivity: number;
	/** OrbitControls damping factor. */
	dampingFactor: number;
	/** 2D ↔ 3D camera transition duration (ms). */
	viewModeTransitionMs: number;
	/** Ground plane Y for node floor clamp. */
	collisionFloorY: number;
	/** Extra gap between node spheres (0 = touch at 2× radius). */
	collisionPadding: number;
	/** Alt-move snap grid size in world units. */
	collisionSnapStep: number;
};

/** Startup / reset eye direction length = defaultDistance, isometric XZ. */
export function defaultPositionFromTune(v: WorldTuneValues): [number, number, number] {
	const d = v.defaultDistance;
	const elev = (v.viewElevationDeg * Math.PI) / 180;
	const xz = (d * Math.sin(elev)) / Math.SQRT2;
	const y = d * Math.cos(elev);
	return [xz, y, xz];
}

function fromWorld(): WorldTuneValues {
	return {
		groundSize: WORLD.groundSize,
		gridMinor: WORLD.gridMinor,
		gridMajor: WORLD.gridMajor,
		gridMega: WORLD.gridMega,
		gridTextureSize: WORLD.grid.textureSize,
		gridFill: WORLD.grid.fill,
		gridMinorColor: WORLD.grid.minor.color,
		gridMinorLineWidth: WORLD.grid.minor.lineWidth,
		gridMajorColor: WORLD.grid.major.color,
		gridMajorLineWidth: WORLD.grid.major.lineWidth,
		gridMegaColor: WORLD.grid.mega.color,
		gridMegaLineWidth: WORLD.grid.mega.lineWidth,
		background: WORLD.background,
		nodeRadius: WORLD.nodeRadius,
		defaultNodeY: WORLD.defaultNodeY,
		nodeColor: WORLD.nodeColor,
		nodeSelectedColor: WORLD.nodeSelectedColor,
		nodeHoverColor: WORLD.nodeHoverColor,
		defaultDistance: WORLD.camera.defaultDistance,
		minDistance: WORLD.camera.minDistance,
		maxDistance: WORLD.camera.maxDistance,
		near: WORLD.camera.near,
		far: WORLD.camera.far,
		fov: WORLD.camera.fov,
		viewElevationDeg: WORLD.camera.viewElevationDeg,
		defaultTargetX: WORLD.camera.defaultTarget.x,
		defaultTargetY: WORLD.camera.defaultTarget.y,
		defaultTargetZ: WORLD.camera.defaultTarget.z,
		minPolarAngle: WORLD.camera.minPolarAngle,
		maxPolarAngle: WORLD.camera.maxPolarAngle,
		minHeight: WORLD.camera.minHeight,
		minEyeY: WORLD.camera.minEyeY,
		labelDistance: WORLD.labelDistance,
		shaftRadius: WORLD.edges.shaftRadius,
		previewShaftRadius: WORLD.edges.previewShaftRadius,
		arrowHeight: WORLD.edges.arrowHeight,
		arrowRadius: WORLD.edges.arrowRadius,
		arrowGapFraction: WORLD.edges.arrowGapFraction,
		panSensitivity: WORLD.controls.panSensitivity,
		rotateSensitivity: WORLD.controls.rotateSensitivity,
		dampingFactor: WORLD.controls.dampingFactor,
		viewModeTransitionMs: WORLD.controls.viewModeTransitionMs,
		collisionFloorY: WORLD.collision.floorY,
		collisionPadding: WORLD.collision.padding,
		collisionSnapStep: WORLD.collision.snapStep
	};
}

/** Full `world-config.ts` source from current tune values. */
export function toWorldConfigSource(v: WorldTuneValues): string {
	const d = v.defaultDistance;
	const elev = v.viewElevationDeg;
	return `/**
 * Canonical world / camera scale for the 3D view.
 *
 * Human-readable tables: \`docs/world-scale.md\`.
 * Keep that doc in sync whenever you change a value here.
 * Live edits: World Tune panel → Save to config (dev server only).
 */
export const WORLD = {
	/**
	 * Ground plane edge length in world units (square \`groundSize × groundSize\`).
	 * The mesh follows the orbit look-target; the grid texture offset keeps lines
	 * locked in world space so the floor feels infinite.
	 */
	groundSize: ${v.groundSize},

	/** Fine grid cell size in world units (1×1). */
	gridMinor: ${v.gridMinor},
	/** Mid grid cell size in world units (10×10). */
	gridMajor: ${v.gridMajor},
	/** Large grid cell size in world units (100×100). One texture tile = one mega cell. */
	gridMega: ${v.gridMega},

	/**
	 * Ground grid canvas appearance.
	 * Drawn in \`GraphScene.createGridTexture\`. One tile covers one mega cell and is
	 * repeated \`groundSize / gridMega\` times per edge.
	 * Stroke \`lineWidth\` values are **canvas pixels** on a \`textureSize\`² tile — not world units.
	 * Mega lines are drawn on left + top edges only so tiled seams do not double-stroke.
	 */
	grid: {
		/** Pixel resolution of one mega-cell canvas tile. */
		textureSize: ${v.gridTextureSize},
		/** Solid fill under grid lines — near scene bg so the floor almost disappears. */
		fill: '${v.gridFill}',
		/** 1×1 (minor) grid stroke. */
		minor: {
			color: '${v.gridMinorColor}',
			lineWidth: ${v.gridMinorLineWidth}
		},
		/** 10×10 (major) grid stroke. */
		major: {
			color: '${v.gridMajorColor}',
			lineWidth: ${v.gridMajorLineWidth}
		},
		/** 100×100 (mega) grid stroke. */
		mega: {
			color: '${v.gridMegaColor}',
			lineWidth: ${v.gridMegaLineWidth}
		}
	},

	/** Three.js scene background and renderer clear color behind the ground. */
	background: '${v.background}',

	/** Default node sphere radius (world units). */
	nodeRadius: ${v.nodeRadius},
	/**
	 * Default node Y so the sphere rests on the ground plane (\`y = 0\`).
	 * Keep equal to \`nodeRadius\`.
	 */
	defaultNodeY: ${v.defaultNodeY},
	/** Idle node sphere color. */
	nodeColor: '${v.nodeColor}',
	/** Selected node sphere color (distinct from hover). */
	nodeSelectedColor: '${v.nodeSelectedColor}',
	/** Pointer-hover node sphere color (distinct from selected). */
	nodeHoverColor: '${v.nodeHoverColor}',

	/**
	 * Perspective camera + OrbitControls defaults.
	 * Pan = orbit target; tilt = polar angle from +Y; zoom = orbit distance.
	 */
	camera: {
		/** Orbit distance at startup and on zoom-reset. */
		defaultDistance: ${d},
		/** Closest allowed orbit distance. */
		minDistance: ${v.minDistance},
		/** Farthest allowed orbit distance. */
		maxDistance: ${v.maxDistance},
		/** Perspective near clip plane. */
		near: ${v.near},
		/** Perspective far clip plane. */
		far: ${v.far},
		/** Vertical field of view in degrees. */
		fov: ${v.fov},
		/**
		 * Polar elevation from +Y in degrees (50 ≈ 40° above the horizon).
		 * Used with \`defaultDistance\` to build \`defaultPosition\` (isometric XZ).
		 */
		viewElevationDeg: ${elev},
		/**
		 * Startup eye position (looks at \`defaultTarget\`).
		 * Direction is also used when resetting orbit angle around the current target.
		 * Length matches \`defaultDistance\`.
		 */
		defaultPosition: [
			(${d} * Math.sin((${elev} * Math.PI) / 180)) / Math.SQRT2,
			${d} * Math.cos((${elev} * Math.PI) / 180),
			(${d} * Math.sin((${elev} * Math.PI) / 180)) / Math.SQRT2
		] as const,
		/** Startup / reset look-at (pan) target. */
		defaultTarget: { x: ${v.defaultTargetX}, y: ${v.defaultTargetY}, z: ${v.defaultTargetZ} } as const,
		/** Smallest polar angle from +Y (radians) — most top-down allowed. */
		minPolarAngle: ${v.minPolarAngle},
		/**
		 * Largest polar angle from +Y (radians) — most edge-on allowed
		 * (~10° above the horizon with the current offset).
		 */
		maxPolarAngle: ${v.maxPolarAngle},
		/** Design note: soft floor for camera height docs. */
		minHeight: ${v.minHeight},
		/** Runtime eye Y floor used by orbit/pan clamps. */
		minEyeY: ${v.minEyeY}
	},

	/** Pointer / orbit feel (not geometry). */
	controls: {
		/** MMB pan: fraction of raycast delta (1 = 1:1 with cursor). */
		panSensitivity: ${v.panSensitivity},
		/** RMB orbit rotateSpeed (OrbitControls default is 1). */
		rotateSensitivity: ${v.rotateSensitivity},
		/** OrbitControls damping factor. */
		dampingFactor: ${v.dampingFactor},
		/** 2D ↔ 3D camera transition duration (ms). */
		viewModeTransitionMs: ${v.viewModeTransitionMs}
	},

	/** Show a node’s floating label when the camera eye (zoom position) is within this world range of it. */
	labelDistance: ${v.labelDistance},

	/**
	 * Solid nodes: no penetration of other nodes or the floor.
	 * Drag keeps the last valid pose until the pointer target is clear.
	 */
	collision: {
		/** Ground plane Y; sphere centers rest at floorY + nodeRadius. */
		floorY: ${v.collisionFloorY},
		/** Extra gap between node spheres (0 = touch at 2× radius). */
		padding: ${v.collisionPadding},
		/** Alt while moving snaps free axes to this world-unit grid. */
		snapStep: ${v.collisionSnapStep}
	},

	/** Edge / arrow geometry (world units). */
	edges: {
		/** Cylinder radius of a committed edge shaft. */
		shaftRadius: ${v.shaftRadius},
		/** Cylinder radius of the in-progress connect preview shaft. */
		previewShaftRadius: ${v.previewShaftRadius},
		/** Cone height of the direction arrow. */
		arrowHeight: ${v.arrowHeight},
		/** Cone base radius of the direction arrow. */
		arrowRadius: ${v.arrowRadius},
		/**
		 * Arrow placement along the edge: fraction of edge length measured back
		 * from the destination node center (0.2 = 20% of the way toward the source).
		 */
		arrowGapFraction: ${v.arrowGapFraction}
	}
} as const;

export type WorldConfig = typeof WORLD;
`;
}

class WorldTuneStore {
	values = $state.raw<WorldTuneValues>(fromWorld());
	open = $state(false);

	toggle(): void {
		this.open = !this.open;
	}

	set(partial: Partial<WorldTuneValues>): void {
		const next = { ...this.values, ...partial };
		if (partial.nodeRadius != null && partial.defaultNodeY === undefined) {
			next.defaultNodeY = partial.nodeRadius;
		}
		this.values = next;
	}

	reset(): void {
		this.values = fromWorld();
	}

	toConfigFile(): string {
		return toWorldConfigSource(this.values);
	}

	/** @deprecated use toConfigFile — kept for clipboard fallback */
	toConfigSnippet(): string {
		return this.toConfigFile();
	}

	/**
	 * Persist current tune values to `src/lib/world/world-config.ts` via Vite dev middleware.
	 */
	async saveToConfigFile(): Promise<void> {
		const res = await fetch('/__yggnet/world-config', {
			method: 'POST',
			headers: { 'Content-Type': 'text/plain; charset=utf-8' },
			body: this.toConfigFile()
		});
		if (!res.ok) {
			const msg = await res.text().catch(() => res.statusText);
			throw new Error(msg || `Save failed (${res.status})`);
		}
	}
}

export const worldTune = new WorldTuneStore();
