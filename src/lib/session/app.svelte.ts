/**
 * Client app session — reactive document, modes, overlays, and actions.
 * Graph mutations go through history.execute so undo/redo works.
 */
import {
	addEdge,
	addNode,
	addRun,
	annotateStep,
	clear as clearHistory,
	clearSelection,
	cloneDocument,
	compareOverlay,
	createEmptyDocument,
	createEmptyOverlay,
	createHistory,
	createRunStore,
	createSelection,
	execute,
	layoutUnpinned,
	findAllSimplePaths,
	findNodesByQuery as searchNodesByQuery,
	findShortestPaths,
	generateGraph,
	getAlgorithm,
	getRun,
	listAlgorithms,
	MainThreadRunner,
	markAllStale,
	parseDocument,
	pathOverlay,
	redo as historyRedo,
	removeEdge,
	removeNode,
	addNodeToSelection,
	removeNodeFromSelection,
	selectNode,
	toggleEdgeInSelection,
	toggleNodeInSelection,
	serializeDocument,
	undo as historyUndo,
	updateEdge,
	updateNode,
	defaultGenerateForm,
	type EdgePatch,
	type GraphDocument,
	type GenerateOptions,
	type GraphKind,
	type History,
	type NodeId,
	type NodePatch,
	type Overlay,
	type RunStore,
	type SelectionState
} from '$lib/graph';
import { WORLD } from '$lib/world/world-config';
import { createNodePadding, findFreePosition } from '$lib/world/node-physics';
import { worldTune } from '$lib/world/world-tune.svelte';
import type { GraphPath } from '$lib/graph/algorithms/adjacency';
import { nextOpenTool, type ToolId } from '$lib/ui/tool-ids';
import { listSaveSlotNames, saveSlotExists, saveSlotStorageKey } from './save-slots';
import { busyHold, waitForBusyOverlayPaint } from './work-busy';

const AUTOSAVE_KEY = 'yggnet.autosave';
const AUTOSAVE_MS = 600;

export type PathMode = 'all' | 'shortest';

export type DirectionsState = {
	fromId: string | null;
	toId: string | null;
	selectedPathId: string | null;
	pathList: GraphPath[];
	pathMode: PathMode;
	traveling: boolean;
	travelProgress: number;
};

export type AnalyzeState = {
	algorithmId: string;
	stepIndex: number;
	showSteps: boolean;
	compareRunIds: string[];
	playback: boolean;
	lastRunId: string | null;
};

export type FiltersState = {
	tags: string[];
	hideFiltered: boolean;
};

export type CameraState = {
	distance: number;
	target: { x: number; y: number; z: number };
	/** Camera eye position in world space. */
	eye: { x: number; y: number; z: number };
	/** Azimuth around +Y in degrees (−180…180). */
	panDeg: number;
	/** Elevation above the horizon in degrees. */
	tiltDeg: number;
};

export type ViewMode = '3d' | '2d';

export type WorkKind = 'load' | 'generate';

export type UiState = {
	paletteOpen: boolean;
	diffIds: string[];
	commandQuery: string;
	/** Open tool section, or null when the dock shows only the toolbar. */
	openTool: ToolId | null;
	/** When set, next node pick completes an edge from this id. */
	connectFromId: string | null;
	/**
	 * Effective directed flag for the in-progress connect (UI + edge create).
	 * Undirected start: follows Ctrl held. Directed start (Ctrl+Alt): stays locked on.
	 */
	connectDirected: boolean;
	/** True when connect was entered as directed — Alt release cannot unlock. */
	connectDirectedLocked: boolean;
	/** Live Alt while connect is active (undirected start can promote to directed). */
	connectAltHeld: boolean;
	/**
	 * Sticky multi-select after Shift+add. Plain LMB toggles; Alt+LMB deselects.
	 * Cleared on replace-select / clear / connect start.
	 */
	multiSelectMode: boolean;
	/**
	 * `3d` — free orbit (current world). `2d` — top-down on the grid plane;
	 * orbit off; pan/move locked to XZ; nodes sit on the floor.
	 */
	viewMode: ViewMode;
	/** Tools panel may grow past the minimap down to the dock bottom. */
	toolsPanelExpanded: boolean;
	/** Companion / selection sheet may grow past the minimap down to the dock bottom. */
	selectionPanelExpanded: boolean;
};

const runner = new MainThreadRunner();
let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function pathIdOf(path: GraphPath, index: number): string {
	return `${index}:${path.nodeIds.join('>')}`;
}

function emptyDirections(): DirectionsState {
	return {
		fromId: null,
		toId: null,
		selectedPathId: null,
		pathList: [],
		pathMode: 'all',
		traveling: false,
		travelProgress: 0
	};
}

function emptyAnalyze(): AnalyzeState {
	return {
		algorithmId: 'bfs',
		stepIndex: 0,
		showSteps: false,
		compareRunIds: [],
		playback: false,
		lastRunId: null
	};
}

class AppStore {
	document = $state.raw<GraphDocument>(createEmptyDocument('Untitled graph'));
	history = $state.raw<History>(createHistory());
	selection = $state.raw<SelectionState>(createSelection());
	overlay = $state.raw<Overlay>(createEmptyOverlay());
	runStore = $state.raw<RunStore>(createRunStore());
	directions = $state.raw<DirectionsState>(emptyDirections());
	analyze = $state.raw<AnalyzeState>(emptyAnalyze());
	filters = $state.raw<FiltersState>({ tags: [], hideFiltered: false });
	camera = $state.raw<CameraState>({
		distance: WORLD.camera.defaultDistance,
		target: { ...WORLD.camera.defaultTarget },
		eye: {
			x: WORLD.camera.defaultPosition[0],
			y: WORLD.camera.defaultPosition[1],
			z: WORLD.camera.defaultPosition[2]
		},
		panDeg:
			(Math.atan2(WORLD.camera.defaultPosition[0], WORLD.camera.defaultPosition[2]) * 180) /
			Math.PI,
		tiltDeg:
			90 -
			(Math.acos(
				Math.min(
					1,
					Math.max(
						-1,
						WORLD.camera.defaultPosition[1] / Math.hypot(...WORLD.camera.defaultPosition)
					)
				)
			) *
				180) /
				Math.PI
	});
	/** Bumped to tween OrbitControls back to the default view angle. */
	cameraOrbitEpoch = $state(0);
	/** Bumped to restore default zoom distance. */
	cameraZoomEpoch = $state(0);
	/** Bumped to pan the look-at back to the default target. */
	cameraTargetEpoch = $state(0);
	/** Bumped when viewMode toggles so GraphScene can apply the camera pose. */
	viewModeEpoch = $state(0);
	/** Bumped when a newly created node should be framed if it sits off-screen. */
	revealEpoch = $state(0);
	revealPosition = $state.raw<{ x: number; y: number; z: number } | null>(null);
	/** Bumped to tween the camera onto the current document's nodes. */
	frameGraphEpoch = $state(0);
	/**
	 * Eye−target offset saved when entering 2D — restored on return to 3D
	 * (scaled to current zoom; target stays where it is).
	 */
	last3dOrbit = $state.raw({
		offset: {
			x: WORLD.camera.defaultPosition[0] - WORLD.camera.defaultTarget.x,
			y: WORLD.camera.defaultPosition[1] - WORLD.camera.defaultTarget.y,
			z: WORLD.camera.defaultPosition[2] - WORLD.camera.defaultTarget.z
		}
	});
	groupsCollapsed = $state.raw<Set<string>>(new Set());
	namedSlots = $state<string[]>([]);
	/** Last Generate type + options; lives here so the panel remount does not reset it. */
	generateForm = $state(defaultGenerateForm());
	ui = $state.raw<UiState>({
		paletteOpen: false,
		diffIds: [],
		commandQuery: '',
		openTool: null,
		connectFromId: null,
		connectDirected: false,
		connectDirectedLocked: false,
		connectAltHeld: false,
		multiSelectMode: false,
		viewMode: '3d',
		toolsPanelExpanded: false,
		selectionPanelExpanded: false
	});
	statusMessage = $state<string>('');
	/** Full-screen overlay while a document is loading or generating. */
	busyKind = $state<WorkKind | null>(null);
	private workAbort: AbortController | null = null;
	private lastReadyDocId: string | null = null;
	private sceneReadyWait: { docId: string; resolve: () => void } | null = null;

	readonly algorithms = listAlgorithms();

	/** Apply a graph mutation with undo support; marks runs stale. */
	private mutate(
		mutateFn: (doc: GraphDocument) => {
			doc: GraphDocument;
			undo: (d: GraphDocument) => GraphDocument;
		}
	): void {
		const result = execute(this.history, this.document, mutateFn);
		this.document = result.doc;
		this.history = result.history;
		this.runStore = markAllStale(this.runStore);
		this.refreshPaths();
		this.syncFilterOverlay();
		this.scheduleAutosave();
	}

	private scheduleAutosave(): void {
		if (typeof localStorage === 'undefined') return;
		if (autosaveTimer) clearTimeout(autosaveTimer);
		autosaveTimer = setTimeout(() => {
			try {
				localStorage.setItem(AUTOSAVE_KEY, serializeDocument(this.document));
			} catch {
				/* quota / private mode */
			}
		}, AUTOSAVE_MS);
	}

	initFromAutosave(): void {
		this.refreshNamedSlots();
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(AUTOSAVE_KEY);
		if (!raw) return;
		try {
			this.replaceDocument(parseDocument(raw), false);
			this.statusMessage = 'Restored autosave';
		} catch {
			/* ignore corrupt autosave */
		}
	}

	/** Frame the open graph from the default pose (zoom out only if needed). */
	frameOpenGraph(): void {
		if (Object.keys(this.document.nodes).length === 0) return;
		this.requestFrameGraph();
	}

	refreshNamedSlots(): void {
		this.namedSlots = typeof localStorage === 'undefined' ? [] : listSaveSlotNames(localStorage);
	}

	replaceDocument(doc: GraphDocument, clearRuns = true): void {
		this.document = doc;
		this.lastReadyDocId = null;
		this.history = clearHistory(this.history);
		this.selection = clearSelection(this.selection);
		if (clearRuns) this.runStore = createRunStore();
		this.directions = emptyDirections();
		this.overlay = createEmptyOverlay();
		this.groupsCollapsed = new Set();
		this.analyze = { ...emptyAnalyze(), algorithmId: this.analyze.algorithmId };
		this.scheduleAutosave();
	}

	beginWork(kind: WorkKind): boolean {
		if (this.busyKind) return false;
		this.workAbort = new AbortController();
		this.busyKind = kind;
		return true;
	}

	get workSignal(): AbortSignal | undefined {
		return this.workAbort?.signal;
	}

	finishWork(): void {
		this.workAbort?.abort();
		this.busyKind = null;
		this.workAbort = null;
		if (this.sceneReadyWait) {
			const resolve = this.sceneReadyWait.resolve;
			this.sceneReadyWait = null;
			resolve();
		}
	}

	onSceneReady(docId: string): void {
		this.lastReadyDocId = docId;
		if (this.sceneReadyWait?.docId === docId) {
			const resolve = this.sceneReadyWait.resolve;
			this.sceneReadyWait = null;
			resolve();
		}
	}

	waitForSceneReady(docId: string, signal?: AbortSignal): Promise<void> {
		if (this.lastReadyDocId === docId) return Promise.resolve();
		if (signal?.aborted) return Promise.resolve();
		return new Promise((resolve) => {
			this.sceneReadyWait = { docId, resolve };
			signal?.addEventListener(
				'abort',
				() => {
					if (this.sceneReadyWait?.docId === docId) {
						this.sceneReadyWait = null;
						resolve();
					}
				},
				{ once: true }
			);
		});
	}

	setDocumentTitle(title: string): void {
		if (this.document.title === title) return;
		this.document = {
			...this.document,
			title,
			updatedAt: new Date().toISOString()
		};
		this.scheduleAutosave();
	}

	setSelection(nodeId: NodeId | null): void {
		this.selection = nodeId ? selectNode(this.selection, nodeId) : clearSelection(this.selection);
	}

	/**
	 * Select a node with modifier semantics:
	 * - `replace` — single selection (exits sticky multi)
	 * - `toggle` — add or remove
	 * - `add` — add only; enters sticky multi-select mode
	 * - `deselect` — remove only (no add)
	 */
	selectNodeWithModifiers(
		nodeId: NodeId,
		mode: 'replace' | 'toggle' | 'add' | 'deselect' = 'replace'
	): void {
		if (mode === 'deselect') {
			this.selection = removeNodeFromSelection(this.selection, nodeId);
			if (this.selection.nodeIds.length === 0) this.setMultiSelectMode(false);
			return;
		}
		if (mode === 'toggle') {
			this.selection = toggleNodeInSelection(this.selection, nodeId);
			if (this.selection.nodeIds.length === 0) this.setMultiSelectMode(false);
			return;
		}
		if (mode === 'add') {
			this.selection = addNodeToSelection(this.selection, nodeId);
			this.setMultiSelectMode(true);
			return;
		}
		this.setMultiSelectMode(false);
		this.setSelection(nodeId);
	}

	setMultiSelectMode(on: boolean): void {
		if (this.ui.multiSelectMode === on) return;
		this.ui = { ...this.ui, multiSelectMode: on };
	}

	toggleEdgeSelection(edgeId: string, additive = false): void {
		if (additive) {
			this.selection = toggleEdgeInSelection(this.selection, edgeId);
			return;
		}
		this.selection = toggleEdgeInSelection(clearSelection(this.selection), edgeId);
	}

	clearAllSelection(): void {
		this.selection = clearSelection(this.selection);
		this.setMultiSelectMode(false);
	}

	canUndo = $derived(this.history.undoStack.length > 0);
	canRedo = $derived(this.history.redoStack.length > 0);

	undo(): void {
		const result = historyUndo(this.history, this.document);
		this.document = result.doc;
		this.history = result.history;
		this.runStore = markAllStale(this.runStore);
		this.refreshPaths();
		this.syncFilterOverlay();
		this.scheduleAutosave();
	}

	redo(): void {
		const result = historyRedo(this.history, this.document);
		this.document = result.doc;
		this.history = result.history;
		this.runStore = markAllStale(this.runStore);
		this.refreshPaths();
		this.syncFilterOverlay();
		this.scheduleAutosave();
	}

	addNode(partial: NodePatch = {}): string {
		let created = '';
		const count = Object.keys(this.document.nodes).length;
		const angle = count * 0.9;
		const radius = 3 + count * 0.35;
		const tune = worldTune.values;
		const preferred =
			partial.position ??
			({
				x: Math.cos(angle) * radius,
				y: tune.defaultNodeY,
				z: Math.sin(angle) * radius
			} as const);
		const blockers = Object.values(this.document.nodes).map((n) => n.position);
		const position = findFreePosition(
			preferred,
			blockers,
			tune.nodeRadius,
			tune.collisionFloorY,
			createNodePadding(tune.nodeRadius)
		);
		this.mutate((d) => {
			const { doc, nodeId } = addNode(d, { ...partial, position });
			created = nodeId;
			return { doc, undo: (cur) => removeNode(cur, nodeId) };
		});
		this.setSelection(created);
		this.requestRevealPosition(position);
		return created;
	}

	updateNode(id: NodeId, patch: NodePatch): void {
		const prev = this.document.nodes[id];
		if (!prev) return;
		const snapshot = {
			label: prev.label,
			position: { ...prev.position },
			pinned: prev.pinned,
			groupId: prev.groupId,
			tags: [...prev.tags],
			weight: prev.weight,
			notes: prev.notes,
			attachments: prev.attachments.map((a) => ({ ...a })),
			data: { ...prev.data }
		};
		this.mutate((d) => ({
			doc: updateNode(d, id, patch),
			undo: (cur) => updateNode(cur, id, snapshot)
		}));
	}

	removeNode(id: NodeId): void {
		const before = cloneDocument(this.document);
		this.mutate((d) => ({
			doc: removeNode(d, id),
			undo: () => cloneDocument(before)
		}));
		if (this.selection.nodeIds.includes(id)) this.setSelection(null);
	}

	addEdge(
		from: NodeId,
		to: NodeId,
		opts: { directed?: boolean; weight?: number; label?: string } = {}
	): string {
		let created = '';
		this.mutate((d) => {
			const { doc, edgeId } = addEdge(d, { from, to, ...opts });
			created = edgeId;
			return { doc, undo: (cur) => removeEdge(cur, edgeId) };
		});
		return created;
	}

	updateEdge(id: string, patch: EdgePatch): void {
		const prev = this.document.edges[id];
		if (!prev) return;
		const snapshot: EdgePatch = {
			from: prev.from,
			to: prev.to,
			directed: prev.directed,
			label: prev.label,
			weight: prev.weight,
			notes: prev.notes,
			attachments: prev.attachments.map((a) => ({ ...a })),
			data: { ...prev.data }
		};
		this.mutate((d) => ({
			doc: updateEdge(d, id, patch),
			undo: (cur) => updateEdge(cur, id, snapshot)
		}));
	}

	removeEdge(id: string): void {
		const before = cloneDocument(this.document);
		this.mutate((d) => ({
			doc: removeEdge(d, id),
			undo: () => cloneDocument(before)
		}));
	}

	pinNode(id: NodeId, pinned = true): void {
		this.updateNode(id, { pinned });
	}

	/** Re-layout unpinned nodes; pinned nodes keep their positions. Undoable. */
	relayout(): void {
		const before = cloneDocument(this.document);
		const after = layoutUnpinned(this.document);
		const changed = Object.keys(after.nodes).some((id) => {
			const a = after.nodes[id].position;
			const b = before.nodes[id].position;
			return a.x !== b.x || a.y !== b.y || a.z !== b.z;
		});
		if (!changed) {
			this.statusMessage = 'Nothing to layout';
			return;
		}
		this.mutate(() => ({
			doc: after,
			undo: () => cloneDocument(before)
		}));
		this.statusMessage = 'Re-layout applied';
	}

	setNodeTags(id: NodeId, tags: string[]): void {
		this.updateNode(id, { tags });
	}

	groupSelected(groupId?: string): string | null {
		const ids = [...this.selection.nodeIds];
		if (ids.length < 2) {
			this.statusMessage =
				ids.length === 0 ? 'Select nodes to group' : 'Select at least 2 nodes to group';
			return null;
		}
		const gid = groupId ?? crypto.randomUUID();
		const before = cloneDocument(this.document);
		this.mutate((d) => {
			let next = d;
			for (const id of ids) {
				next = updateNode(next, id, { groupId: gid });
			}
			return { doc: next, undo: () => cloneDocument(before) };
		});
		this.statusMessage = `Grouped ${ids.length} nodes`;
		return gid;
	}

	ungroup(groupId: string): void {
		const before = cloneDocument(this.document);
		this.mutate((d) => {
			let next = d;
			for (const node of Object.values(d.nodes)) {
				if (node.groupId === groupId) {
					next = updateNode(next, node.id, { groupId: undefined });
				}
			}
			return { doc: next, undo: () => cloneDocument(before) };
		});
		const nextCollapsed = new Set(this.groupsCollapsed);
		nextCollapsed.delete(groupId);
		this.groupsCollapsed = nextCollapsed;
	}

	toggleCollapseGroup(groupId: string): void {
		const next = new Set(this.groupsCollapsed);
		if (next.has(groupId)) next.delete(groupId);
		else next.add(groupId);
		this.groupsCollapsed = next;
	}

	setFilterTags(tags: string[]): void {
		this.filters = { ...this.filters, tags };
		this.syncFilterOverlay();
	}

	setHideFiltered(hide: boolean): void {
		this.filters = { ...this.filters, hideFiltered: hide };
		this.syncFilterOverlay();
	}

	nodePassesFilter(id: NodeId): boolean {
		const { tags } = this.filters;
		if (tags.length === 0) return true;
		const node = this.document.nodes[id];
		if (!node) return false;
		return tags.some((t) => node.tags.includes(t));
	}

	private syncFilterOverlay(): void {
		const { tags, hideFiltered } = this.filters;
		if (tags.length === 0 || this.overlayLocked() || this.analyze.showSteps) {
			if (this.overlay.kind === 'filter') this.overlay = createEmptyOverlay();
			return;
		}
		const nodeIds = Object.keys(this.document.nodes).filter((id) => this.nodePassesFilter(id));
		const edgeIds = Object.values(this.document.edges)
			.filter((e) => nodeIds.includes(e.from) && nodeIds.includes(e.to))
			.map((e) => e.id);
		this.overlay = {
			kind: 'filter',
			nodeIds,
			edgeIds,
			dimOthers: hideFiltered
		};
	}

	setDirectionsEndpoints(fromId: string | null, toId: string | null): void {
		this.directions = {
			...this.directions,
			fromId,
			toId,
			selectedPathId: null,
			traveling: false,
			travelProgress: 0
		};
		this.refreshPaths();
	}

	setPathMode(pathMode: PathMode): void {
		this.directions = { ...this.directions, pathMode, selectedPathId: null };
		this.refreshPaths();
	}

	refreshPaths(): void {
		const { fromId, toId, pathMode, selectedPathId } = this.directions;
		if (!fromId || !toId) {
			this.directions = { ...this.directions, pathList: [], selectedPathId: null };
			if (this.overlay.kind === 'path') this.overlay = createEmptyOverlay();
			return;
		}
		const pathList =
			pathMode === 'shortest'
				? findShortestPaths(this.document, fromId, toId)
				: findAllSimplePaths(this.document, fromId, toId);
		let nextSelected = selectedPathId;
		if (nextSelected && !pathList.some((p, i) => pathIdOf(p, i) === nextSelected)) {
			nextSelected = pathList.length ? pathIdOf(pathList[0], 0) : null;
		}
		this.directions = { ...this.directions, pathList, selectedPathId: nextSelected };
		if (nextSelected) this.selectPath(nextSelected);
		else if (this.overlay.kind === 'path') this.overlay = createEmptyOverlay();
	}

	selectPath(pathId: string | null): void {
		this.directions = {
			...this.directions,
			selectedPathId: pathId,
			traveling: false,
			travelProgress: 0
		};
		if (!pathId) {
			if (this.overlay.kind === 'path') this.overlay = createEmptyOverlay();
			return;
		}
		const path = this.directions.pathList.find((p, i) => pathIdOf(p, i) === pathId);
		if (path) {
			this.overlay = pathOverlay(path.nodeIds, path.edgeIds);
		}
	}

	startTravel(): void {
		if (!this.directions.selectedPathId) return;
		this.directions = { ...this.directions, traveling: true, travelProgress: 0 };
	}

	setTravelProgress(t: number): void {
		this.directions = {
			...this.directions,
			travelProgress: Math.min(1, Math.max(0, t))
		};
	}

	stopTravel(): void {
		this.directions = { ...this.directions, traveling: false };
	}

	/** One-hop follow along an edge from the selected node. */
	followEdge(edgeId: string): void {
		const edge = this.document.edges[edgeId];
		const sel = this.selection.nodeIds[0];
		if (!edge || !sel) return;
		let to: string | null = null;
		if (edge.from === sel) to = edge.to;
		else if (!edge.directed && edge.to === sel) to = edge.from;
		if (!to) return;
		this.directions = {
			...this.directions,
			fromId: sel,
			toId: to,
			pathMode: 'shortest',
			pathList: [{ nodeIds: [sel, to], edgeIds: [edgeId] }],
			selectedPathId: pathIdOf({ nodeIds: [sel, to], edgeIds: [edgeId] }, 0),
			traveling: true,
			travelProgress: 0
		};
		this.overlay = pathOverlay([sel, to], [edgeId]);
	}

	setAlgorithm(algorithmId: string): void {
		this.analyze = { ...this.analyze, algorithmId };
	}

	async runAlgorithm(extraParams: Record<string, unknown> = {}): Promise<string | null> {
		const algo = getAlgorithm(this.analyze.algorithmId);
		if (!algo) {
			this.statusMessage = 'Unknown algorithm';
			return null;
		}
		const from = this.directions.fromId ?? this.selection.nodeIds[0] ?? '';
		const to = this.directions.toId ?? '';
		if (algo.needs.from && !from) {
			this.statusMessage = 'Set a from node';
			return null;
		}
		if (algo.needs.to && !to) {
			this.statusMessage = 'Set a to node';
			return null;
		}
		const snapshot = cloneDocument(this.document);
		const output = await runner.run({
			documentSnapshot: snapshot,
			algorithmId: this.analyze.algorithmId,
			params: { from, to, ...extraParams }
		});
		const { store, run } = addRun(this.runStore, {
			algorithmId: this.analyze.algorithmId,
			params: { from, to, ...extraParams },
			result: output.result,
			trace: output.trace
		});
		this.runStore = store;
		this.analyze = {
			...this.analyze,
			lastRunId: run.id,
			stepIndex: 0,
			showSteps: false
		};
		this.applyRunOverlay(run.id);
		this.statusMessage = `Ran ${algo.name}`;
		return run.id;
	}

	setShowSteps(show: boolean): void {
		this.analyze = {
			...this.analyze,
			showSteps: show,
			stepIndex: show ? this.analyze.stepIndex : 0,
			playback: show ? this.analyze.playback : false
		};
		if (this.analyze.lastRunId) this.applyRunOverlay(this.analyze.lastRunId);
	}

	setStepIndex(index: number): void {
		this.analyze = { ...this.analyze, stepIndex: Math.max(0, index) };
		if (this.analyze.lastRunId) this.applyRunOverlay(this.analyze.lastRunId);
	}

	setPlayback(playback: boolean): void {
		this.analyze = { ...this.analyze, playback };
	}

	togglePlayback(): void {
		this.setPlayback(!this.analyze.playback);
	}

	annotateCurrentStep(note: string): void {
		const runId = this.analyze.lastRunId;
		if (!runId) return;
		this.runStore = annotateStep(this.runStore, runId, this.analyze.stepIndex, note);
	}

	setCompareRunIds(ids: string[]): void {
		this.analyze = { ...this.analyze, compareRunIds: ids.slice(0, 2) };
		this.rebuildModeOverlay();
	}

	/** Compare two stored runs in a dual overlay (series A / B). */
	compareRuns(runIdA: string, runIdB: string): void {
		const a = getRun(this.runStore, runIdA);
		const b = getRun(this.runStore, runIdB);
		if (!a || !b) {
			this.statusMessage = 'Select two valid stored runs';
			return;
		}
		if (runIdA === runIdB) {
			this.statusMessage = 'Pick two different runs to compare';
			return;
		}
		this.analyze = {
			...this.analyze,
			compareRunIds: [runIdA, runIdB],
			lastRunId: runIdA
		};
		this.rebuildModeOverlay();
		this.statusMessage = `Comparing ${a.algorithmId} vs ${b.algorithmId}`;
	}

	clearCompare(): void {
		const fallback = this.analyze.compareRunIds[0] ?? this.analyze.lastRunId;
		this.analyze = { ...this.analyze, compareRunIds: [] };
		if (fallback) {
			this.analyze = { ...this.analyze, lastRunId: fallback };
			this.applyRunOverlay(fallback);
		} else {
			this.rebuildModeOverlay();
		}
	}

	async compareAlgorithms(otherId: string): Promise<void> {
		const primary = await this.runAlgorithm();
		const prev = this.analyze.algorithmId;
		this.analyze = { ...this.analyze, algorithmId: otherId };
		const secondary = await this.runAlgorithm();
		this.analyze = { ...this.analyze, algorithmId: prev };
		const ids = [primary, secondary].filter(Boolean) as string[];
		this.analyze = { ...this.analyze, compareRunIds: ids };
		this.rebuildModeOverlay();
	}

	private applyRunOverlay(runId: string): void {
		const run = getRun(this.runStore, runId);
		if (!run) return;
		if (this.analyze.showSteps) {
			const nodeIds: string[] = [];
			const edgeIds: string[] = [];
			const end = Math.min(this.analyze.stepIndex, run.trace.length - 1);
			for (let i = 0; i <= end; i++) {
				const ev = run.trace[i];
				if (ev.type === 'visit') nodeIds.push(ev.nodeId);
				if (ev.type === 'relax') edgeIds.push(ev.edgeId);
			}
			this.overlay = { kind: 'algo', nodeIds, edgeIds, dimOthers: true };
			return;
		}
		if (run.result.kind === 'path') {
			const path = pathOverlay(run.result.nodeIds, run.result.edgeIds);
			this.overlay = { ...path, kind: 'algo' };
		} else {
			this.overlay = { kind: 'algo', nodeIds: [], edgeIds: [], dimOthers: false };
		}
	}

	private pathSeriesFromRun(run: ReturnType<typeof getRun>): {
		nodeIds: string[];
		edgeIds: string[];
	} {
		if (run?.result.kind === 'path') {
			return { nodeIds: run.result.nodeIds, edgeIds: run.result.edgeIds };
		}
		return { nodeIds: [], edgeIds: [] };
	}

	private overlayLocked(): boolean {
		return (
			this.overlay.kind === 'path' ||
			this.overlay.kind === 'algo' ||
			this.overlay.kind === 'compare'
		);
	}

	private rebuildModeOverlay(): void {
		const { compareRunIds } = this.analyze;
		if (compareRunIds.length === 2) {
			const a = getRun(this.runStore, compareRunIds[0]);
			const b = getRun(this.runStore, compareRunIds[1]);
			this.overlay = compareOverlay(this.pathSeriesFromRun(a), this.pathSeriesFromRun(b));
			return;
		}
		if (this.overlay.kind === 'algo' && this.analyze.lastRunId) {
			this.applyRunOverlay(this.analyze.lastRunId);
			return;
		}
		if (this.overlay.kind === 'path' && this.directions.selectedPathId) {
			this.selectPath(this.directions.selectedPathId);
			return;
		}
		this.syncFilterOverlay();
	}

	setCamera(partial: Partial<CameraState>): void {
		const distance = partial.distance ?? this.camera.distance;
		const target = partial.target ?? this.camera.target;
		const eye = partial.eye ?? this.camera.eye;
		const panDeg = partial.panDeg ?? this.camera.panDeg;
		const tiltDeg = partial.tiltDeg ?? this.camera.tiltDeg;
		if (
			distance === this.camera.distance &&
			target.x === this.camera.target.x &&
			target.y === this.camera.target.y &&
			target.z === this.camera.target.z &&
			eye.x === this.camera.eye.x &&
			eye.y === this.camera.eye.y &&
			eye.z === this.camera.eye.z &&
			panDeg === this.camera.panDeg &&
			tiltDeg === this.camera.tiltDeg
		) {
			return;
		}
		this.camera = {
			distance,
			target: { x: target.x, y: target.y, z: target.z },
			eye: { x: eye.x, y: eye.y, z: eye.z },
			panDeg,
			tiltDeg
		};
	}

	/** Pan target back to world origin. */
	resetCameraTarget(): void {
		this.cameraTargetEpoch += 1;
	}

	/** Restore the default isometric viewing angle (keeps target + zoom). */
	resetCameraOrbit(): void {
		this.cameraOrbitEpoch += 1;
	}

	/** Restore default zoom distance. */
	resetCameraZoom(): void {
		this.cameraZoomEpoch += 1;
	}

	/** Ask the scene to zoom out if `position` is outside the current view. */
	requestRevealPosition(position: { x: number; y: number; z: number }): void {
		this.revealPosition = { x: position.x, y: position.y, z: position.z };
		this.revealEpoch += 1;
	}

	/** Ask the scene to look at the current graph and zoom so every node fits. */
	requestFrameGraph(): void {
		this.frameGraphEpoch += 1;
	}

	/** Toggle top-down 2D ↔ free 3D orbit. Keeps current target + zoom. */
	toggleViewMode(): void {
		// Orbit snapshot is captured in GraphScene when a 2D tween actually starts
		// from a settled Y-up pose (so mid-animation mash doesn't overwrite it).
		this.ui = { ...this.ui, viewMode: this.ui.viewMode === '3d' ? '2d' : '3d' };
		this.viewModeEpoch += 1;
	}

	/** Saved by GraphScene when leaving settled 3D for 2D. */
	saveLast3dOrbit(offset: { x: number; y: number; z: number }): void {
		this.last3dOrbit = { offset: { x: offset.x, y: offset.y, z: offset.z } };
	}

	get isView2d(): boolean {
		return this.ui.viewMode === '2d';
	}

	openPalette(open = true): void {
		this.ui = { ...this.ui, paletteOpen: open, commandQuery: open ? this.ui.commandQuery : '' };
	}

	setCommandQuery(q: string): void {
		this.ui = { ...this.ui, commandQuery: q };
	}

	setDiffIds(ids: string[]): void {
		this.ui = { ...this.ui, diffIds: ids.slice(0, 2) };
	}

	setOpenTool(id: ToolId | null): void {
		this.ui = {
			...this.ui,
			openTool: id,
			toolsPanelExpanded: false,
			selectionPanelExpanded: false
		};
	}

	setToolsPanelExpanded(expanded: boolean): void {
		this.ui = { ...this.ui, toolsPanelExpanded: expanded };
	}

	setSelectionPanelExpanded(expanded: boolean): void {
		this.ui = { ...this.ui, selectionPanelExpanded: expanded };
	}

	toggleTool(id: ToolId): void {
		this.setOpenTool(nextOpenTool(this.ui.openTool, id));
	}

	/** Close the open section panel, or open Nodes. */
	toggleManager(): void {
		this.setOpenTool(this.ui.openTool ? null : 'nodes');
	}

	setManagerOpen(open: boolean): void {
		this.setOpenTool(open ? (this.ui.openTool ?? 'nodes') : null);
	}

	setConnectFrom(nodeId: string | null, opts: { directed?: boolean } = {}): void {
		if (!nodeId) {
			this.ui = {
				...this.ui,
				connectFromId: null,
				connectDirected: false,
				connectDirectedLocked: false,
				connectAltHeld: false
			};
			return;
		}
		const locked = Boolean(opts.directed);
		// Connect and node-info are exclusive — close any open sheet first.
		this.selection = clearSelection(this.selection);
		this.ui = {
			...this.ui,
			connectFromId: nodeId,
			connectDirectedLocked: locked,
			connectAltHeld: false,
			connectDirected: locked,
			multiSelectMode: false
		};
	}

	/** Live Alt while connecting — promotes undirected→directed; never demotes a locked directed start. */
	setConnectAltHeld(held: boolean): void {
		if (!this.ui.connectFromId) return;
		if (this.ui.connectAltHeld === held) return;
		const directed = this.ui.connectDirectedLocked || held;
		this.ui = { ...this.ui, connectAltHeld: held, connectDirected: directed };
	}

	/** Start connect from the primary selected node (or `fallbackId` if none). */
	beginConnectFromSelection(opts: { directed?: boolean; fallbackId?: string } = {}): boolean {
		const from = this.selection.nodeIds[0] ?? opts.fallbackId ?? null;
		if (!from || !this.document.nodes[from]) {
			this.statusMessage = 'Select a node first, then Ctrl+click to connect';
			return false;
		}
		this.setConnectFrom(from, { directed: opts.directed });
		return true;
	}

	/** Place a node at a world position (in-world create). */
	addNodeAt(position: { x: number; y: number; z: number }, label?: string): string {
		const count = Object.keys(this.document.nodes).length;
		return this.addNode({
			label: label ?? `Node ${count + 1}`,
			position
		});
	}

	/** Place a node near the current camera look-target (HUD / Nodes panel create). */
	addNodeNearView(label?: string): string {
		const t = this.camera.target;
		const n = Object.keys(this.document.nodes).length;
		const jitter = (n % 5) * 0.4;
		return this.addNodeAt(
			{ x: t.x + jitter, y: worldTune.values.defaultNodeY, z: t.z + jitter },
			label
		);
	}

	/** Remove current selection (nodes and/or edges). */
	deleteSelection(): void {
		const nodeIds = [...this.selection.nodeIds];
		const edgeIds = [...this.selection.edgeIds];
		for (const id of edgeIds) this.removeEdge(id);
		for (const id of nodeIds) this.removeNode(id);
		this.clearAllSelection();
	}

	tryConnectTo(toId: string, opts: { altHeld?: boolean } = {}): boolean {
		const from = this.ui.connectFromId;
		if (!from || from === toId) return false;
		if (opts.altHeld !== undefined) this.setConnectAltHeld(opts.altHeld);
		const directed = this.ui.connectDirectedLocked || this.ui.connectAltHeld;
		this.addEdge(from, toId, { directed });
		this.setConnectFrom(null);
		// Destination click completes the edge only — do not select / open node info.
		this.statusMessage = directed ? 'Connected (directed)' : 'Connected';
		return true;
	}

	saveToSlot(slot: string): void {
		const key = saveSlotStorageKey(slot);
		if (!key) {
			this.statusMessage = 'Enter a slot name';
			return;
		}
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(key, serializeDocument(this.document));
		this.refreshNamedSlots();
		this.statusMessage = 'Saved';
	}

	saveNamedSlot(name: string): void {
		const key = saveSlotStorageKey(name);
		if (!key) {
			this.statusMessage = 'Enter a slot name';
			return;
		}
		if (typeof localStorage === 'undefined') return;
		if (saveSlotExists(localStorage, name) && !this.confirmOverwriteSlot(name.trim())) return;
		this.saveToSlot(name);
	}

	loadFromSlot(slot: string): void {
		const key = saveSlotStorageKey(slot);
		if (!key) {
			this.statusMessage = 'Enter a slot name';
			return;
		}
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(key);
		if (!raw) {
			this.statusMessage = 'No save found';
			return;
		}
		try {
			const doc = parseDocument(raw);
			void this.applyLoadedDocument(doc, 'Loaded');
		} catch (e) {
			this.statusMessage = e instanceof Error ? e.message : 'Load failed';
		}
	}

	loadNamedSlot(name: string): void {
		const key = saveSlotStorageKey(name);
		if (!key) {
			this.statusMessage = 'Enter a slot name';
			return;
		}
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(key);
		if (!raw) {
			this.statusMessage = 'No save found';
			return;
		}
		if (!this.confirmReplaceDocument()) return;
		this.loadFromSlot(name);
	}

	deleteNamedSlot(name: string): void {
		const key = saveSlotStorageKey(name);
		if (!key || typeof localStorage === 'undefined') return;
		if (!this.confirmDeleteSlot(name.trim())) return;
		localStorage.removeItem(key);
		this.refreshNamedSlots();
		this.statusMessage = 'Deleted';
	}

	private confirmOverwriteSlot(name: string): boolean {
		if (typeof window === 'undefined') return true;
		return window.confirm(`Replace the saved graph “${name}”?`);
	}

	private confirmDeleteSlot(name: string): boolean {
		if (typeof window === 'undefined') return true;
		return window.confirm(`Delete the saved graph “${name}”?`);
	}

	private confirmReplaceDocument(): boolean {
		if (typeof window === 'undefined') return true;
		if (Object.keys(this.document.nodes).length === 0) return true;
		return window.confirm('Replace the current document with the saved one?');
	}

	jumpToNode(nodeId: NodeId): void {
		const node = this.document.nodes[nodeId];
		if (!node) return;
		this.setSelection(nodeId);
		this.setCamera({
			target: { ...node.position },
			distance: Math.min(this.camera.distance, 14)
		});
	}

	exportJson(): string {
		return serializeDocument(this.document);
	}

	downloadExport(filename = 'yggnet-graph.json'): void {
		const json = this.exportJson();
		const blob = new Blob([json], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = globalThis.document.createElement('a');
		a.href = url;
		a.download = filename;
		a.click();
		URL.revokeObjectURL(url);
	}

	async importJson(json: string): Promise<void> {
		try {
			const doc = parseDocument(json);
			await this.applyLoadedDocument(doc, 'Imported');
		} catch (e) {
			this.statusMessage = e instanceof Error ? e.message : 'Import failed';
			throw e;
		}
	}

	async applyGeneratedGraph(kind: GraphKind, options: GenerateOptions = {}): Promise<void> {
		if (!this.beginWork('generate')) return;
		const signal = this.workAbort?.signal;
		try {
			await waitForBusyOverlayPaint();
			const doc = generateGraph(kind, { ...options, nodeY: worldTune.values.defaultNodeY });
			this.replaceDocument(doc);
			this.requestFrameGraph();
			await busyHold(signal);
			await this.waitForSceneReady(this.document.id, signal);
			this.statusMessage = 'Generated';
		} finally {
			this.finishWork();
		}
	}

	private async applyLoadedDocument(doc: GraphDocument, doneMessage: string): Promise<void> {
		if (!this.beginWork('load')) return;
		const signal = this.workAbort?.signal;
		try {
			await waitForBusyOverlayPaint();
			this.replaceDocument(doc);
			this.statusMessage = doneMessage;
			await this.waitForSceneReady(this.document.id, signal);
		} finally {
			this.finishWork();
		}
	}

	findNodeByQuery(query: string): NodeId | null {
		return searchNodesByQuery(this.document, query)[0] ?? null;
	}

	findNodesByQuery(query: string): NodeId[] {
		return searchNodesByQuery(this.document, query);
	}

	pathKey(path: GraphPath, index: number): string {
		return pathIdOf(path, index);
	}

	selectedPath(): GraphPath | null {
		const { selectedPathId, pathList } = this.directions;
		if (!selectedPathId) return null;
		return pathList.find((p, i) => pathIdOf(p, i) === selectedPathId) ?? null;
	}

	travelPosition(): { x: number; y: number; z: number } | null {
		const path = this.selectedPath();
		if (!path || path.nodeIds.length === 0) return null;
		const t = this.directions.travelProgress;
		const pts = path.nodeIds.map((id) => this.document.nodes[id]?.position).filter(Boolean) as {
			x: number;
			y: number;
			z: number;
		}[];
		if (pts.length === 0) return null;
		if (pts.length === 1) return { ...pts[0] };
		const segCount = pts.length - 1;
		const f = t * segCount;
		const i = Math.min(segCount - 1, Math.floor(f));
		const local = f - i;
		const a = pts[i];
		const b = pts[i + 1];
		return {
			x: a.x + (b.x - a.x) * local,
			y: a.y + (b.y - a.y) * local + 2,
			z: a.z + (b.z - a.z) * local
		};
	}
}

export const app = new AppStore();

/** Convenience re-exports for session / tests. */
export { AUTOSAVE_KEY, pathIdOf };
