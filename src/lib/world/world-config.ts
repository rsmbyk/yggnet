/**
 * Canonical world / camera scale for the 3D view.
 *
 * Human-readable tables: `docs/world-scale.md`.
 * Keep that doc in sync whenever you change a value here.
 * Live edits: World Tune panel → Save to config (dev server only).
 */
export const WORLD = {
	/**
	 * Ground plane edge length in world units (square `groundSize × groundSize`).
	 * The mesh follows the orbit look-target; the grid texture offset keeps lines
	 * locked in world space so the floor feels infinite.
	 */
	groundSize: 1000,

	/** Fine grid cell size in world units (1×1). */
	gridMinor: 1,
	/** Mid grid cell size in world units (10×10). */
	gridMajor: 10,
	/** Large grid cell size in world units (100×100). One texture tile = one mega cell. */
	gridMega: 100,

	/**
	 * Ground grid canvas appearance.
	 * Drawn in `GraphScene.createGridTexture`. One tile covers one mega cell and is
	 * repeated `groundSize / gridMega` times per edge.
	 * Stroke `lineWidth` values are **canvas pixels** on a `textureSize`² tile — not world units.
	 * Mega lines are drawn on left + top edges only so tiled seams do not double-stroke.
	 */
	grid: {
		/** Pixel resolution of one mega-cell canvas tile. */
		textureSize: 250,
		/** Solid fill under grid lines — near scene bg so the floor almost disappears. */
		fill: '#2b3340',
		/** 1×1 (minor) grid stroke. */
		minor: {
			color: '#2e3642',
			lineWidth: 1
		},
		/** 10×10 (major) grid stroke. */
		major: {
			color: '#313944',
			lineWidth: 1
		},
		/** 100×100 (mega) grid stroke. */
		mega: {
			color: '#353e4a',
			lineWidth: 1
		}
	},

	/** Three.js scene background and renderer clear color behind the ground. */
	background: '#2a3340',

	/** Default node sphere radius (world units). */
	nodeRadius: 1,
	/**
	 * Default node Y so the sphere rests on the ground plane (`y = 0`).
	 * Keep equal to `nodeRadius`.
	 */
	defaultNodeY: 1,
	/** Idle node sphere color. */
	nodeColor: '#7a8a9a',
	/** Selected node sphere color (distinct from hover). */
	nodeSelectedColor: '#c4a35a',
	/** Pointer-hover node sphere color (distinct from selected). */
	nodeHoverColor: '#6eb0c8',

	/**
	 * Perspective camera + OrbitControls defaults.
	 * Pan = orbit target; tilt = polar angle from +Y; zoom = orbit distance.
	 */
	camera: {
		/** Orbit distance at startup and on zoom-reset. */
		defaultDistance: 50,
		/** Closest allowed orbit distance. */
		minDistance: 2.5,
		/** Farthest allowed orbit distance. */
		maxDistance: 200,
		/** Perspective near clip plane. */
		near: 0.5,
		/** Perspective far clip plane. */
		far: 500,
		/** Vertical field of view in degrees. */
		fov: 50,
		/**
		 * Polar elevation from +Y in degrees (50 ≈ 40° above the horizon).
		 * Used with `defaultDistance` to build `defaultPosition` (isometric XZ).
		 */
		viewElevationDeg: 50,
		/**
		 * Startup eye position (looks at `defaultTarget`).
		 * Direction is also used when resetting orbit angle around the current target.
		 * Length matches `defaultDistance`.
		 */
		defaultPosition: [
			(50 * Math.sin((50 * Math.PI) / 180)) / Math.SQRT2,
			50 * Math.cos((50 * Math.PI) / 180),
			(50 * Math.sin((50 * Math.PI) / 180)) / Math.SQRT2
		] as const,
		/** Startup / reset look-at (pan) target. */
		defaultTarget: { x: 0, y: 0, z: 0 } as const,
		/** Smallest polar angle from +Y (radians) — most top-down allowed. */
		minPolarAngle: 0.15,
		/**
		 * Largest polar angle from +Y (radians) — most edge-on allowed
		 * (~10° above the horizon with the current offset).
		 */
		maxPolarAngle: 1.3907963267948966,
		/** Design note: soft floor for camera height docs. */
		minHeight: 0.85,
		/** Runtime eye Y floor used by orbit/pan clamps. */
		minEyeY: 1.25
	},

	/** Pointer / orbit feel (not geometry). */
	controls: {
		/** MMB pan: fraction of raycast delta (1 = 1:1 with cursor). */
		panSensitivity: 0.85,
		/** RMB orbit rotateSpeed (OrbitControls default is 1). */
		rotateSensitivity: 0.55,
		/** OrbitControls damping factor. */
		dampingFactor: 0.12,
		/** 2D ↔ 3D camera transition duration (ms). */
		viewModeTransitionMs: 320
	},

	/** Show a node’s floating label when the camera eye (zoom position) is within this world range of it. */
	labelDistance: 50,

	/**
	 * Solid nodes: no penetration of other nodes or the floor.
	 * Drag keeps the last valid pose until the pointer target is clear.
	 */
	collision: {
		/** Ground plane Y; sphere centers rest at floorY + nodeRadius. */
		floorY: 0,
		/** Extra gap between node spheres (0 = touch at 2× radius). */
		padding: 0,
		/** Alt while moving snaps free axes to this world-unit grid. */
		snapStep: 1
	},

	/** Edge / arrow geometry (world units). */
	edges: {
		/** Cylinder radius of a committed edge shaft. */
		shaftRadius: 0.1,
		/** Cylinder radius of the in-progress connect preview shaft. */
		previewShaftRadius: 0.05,
		/** Cone height of the direction arrow. */
		arrowHeight: 1,
		/** Cone base radius of the direction arrow. */
		arrowRadius: 0.3,
		/**
		 * Arrow placement along the edge: fraction of edge length measured back
		 * from the destination node center (0.2 = 20% of the way toward the source).
		 */
		arrowGapFraction: 0.2
	}
} as const;

export type WorldConfig = typeof WORLD;
