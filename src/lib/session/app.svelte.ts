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
	type AppMode,
	type EdgePatch,
	type GraphDocument,
	type History,
	type NodeId,
	type NodePatch,
	type Overlay,
	type RunStore,
	type SelectionState
} from '$lib/graph';
import { WORLD } from '$lib/world/world-config';
import { findFreePosition } from '$lib/world/node-physics';
import { worldTune } from '$lib/world/world-tune.svelte';
import type { GraphPath } from '$lib/graph/algorithms/adjacency';

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

export type UiState = {
	paletteOpen: boolean;
	diffIds: string[];
	commandQuery: string;
	/** Advanced manager drawer — closed by default; world is primary. */
	managerOpen: boolean;
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
	mode = $state<AppMode>('explore');
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
		panDeg: (Math.atan2(WORLD.camera.defaultPosition[0], WORLD.camera.defaultPosition[2]) * 180) / Math.PI,
		tiltDeg:
			90 -
			(Math.acos(
				Math.min(
					1,
					Math.max(
						-1,
						WORLD.camera.defaultPosition[1] /
							Math.hypot(...WORLD.camera.defaultPosition)
					)
				)
			) *
				180) /
				Math.PI
	});
	/** Bumped to snap OrbitControls back to the default view angle. */
	cameraOrbitEpoch = $state(0);
	/** Bumped when viewMode toggles so GraphScene can apply the camera pose. */
	viewModeEpoch = $state(0);
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
	ui = $state.raw<UiState>({
		paletteOpen: false,
		diffIds: [],
		commandQuery: '',
		managerOpen: false,
		connectFromId: null,
		connectDirected: false,
		connectDirectedLocked: false,
		connectAltHeld: false,
		multiSelectMode: false,
		viewMode: '3d'
	});
	statusMessage = $state<string>('');

	readonly algorithms = listAlgorithms();

	/** Apply a graph mutation with undo support; marks runs stale. */
	private mutate(
		mutateFn: (doc: GraphDocument) => { doc: GraphDocument; undo: (d: GraphDocument) => GraphDocument }
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

	replaceDocument(doc: GraphDocument, clearRuns = true): void {
		this.document = doc;
		this.history = clearHistory(this.history);
		this.selection = clearSelection(this.selection);
		if (clearRuns) this.runStore = createRunStore();
		this.directions = emptyDirections();
		this.overlay = createEmptyOverlay();
		this.groupsCollapsed = new Set();
		this.analyze = { ...emptyAnalyze(), algorithmId: this.analyze.algorithmId };
		this.scheduleAutosave();
	}

	setMode(mode: AppMode): void {
		this.mode = mode;
		if (mode !== 'directions') {
			this.directions = { ...this.directions, traveling: false };
		}
		if (mode === 'directions') this.refreshPaths();
		this.rebuildModeOverlay();
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
			tune.collisionPadding
		);
		this.mutate((d) => {
			const { doc, nodeId } = addNode(d, { ...partial, position });
			created = nodeId;
			return { doc, undo: (cur) => removeNode(cur, nodeId) };
		});
		this.setSelection(created);
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

	addEdge(from: NodeId, to: NodeId, opts: { directed?: boolean; weight?: number; label?: string } = {}): string {
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
		if (tags.length === 0 || this.mode === 'directions' || this.analyze.showSteps) {
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
			if (this.mode === 'directions') this.overlay = createEmptyOverlay();
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
		else if (this.mode === 'directions') this.overlay = createEmptyOverlay();
	}

	selectPath(pathId: string | null): void {
		this.directions = {
			...this.directions,
			selectedPathId: pathId,
			traveling: false,
			travelProgress: 0
		};
		if (!pathId) {
			if (this.mode === 'directions') this.overlay = createEmptyOverlay();
			return;
		}
		const path = this.directions.pathList.find((p, i) => pathIdOf(p, i) === pathId);
		if (path) {
			this.overlay = pathOverlay(path.nodeIds, path.edgeIds);
			this.mode = 'directions';
		}
	}

	startTravel(): void {
		if (!this.directions.selectedPathId) return;
		this.directions = { ...this.directions, traveling: true, travelProgress: 0 };
		this.mode = 'directions';
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
		this.mode = 'directions';
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
		this.mode = 'analyze';
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
		this.mode = 'analyze';
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

	private pathSeriesFromRun(run: ReturnType<typeof getRun>): { nodeIds: string[]; edgeIds: string[] } {
		if (run?.result.kind === 'path') {
			return { nodeIds: run.result.nodeIds, edgeIds: run.result.edgeIds };
		}
		return { nodeIds: [], edgeIds: [] };
	}

	private rebuildModeOverlay(): void {
		const { compareRunIds } = this.analyze;
		if (compareRunIds.length === 2) {
			const a = getRun(this.runStore, compareRunIds[0]);
			const b = getRun(this.runStore, compareRunIds[1]);
			this.overlay = compareOverlay(this.pathSeriesFromRun(a), this.pathSeriesFromRun(b));
			return;
		}
		if (this.mode === 'analyze' && this.analyze.lastRunId) {
			this.applyRunOverlay(this.analyze.lastRunId);
			return;
		}
		if (this.mode === 'directions' && this.directions.selectedPathId) {
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
		const v = worldTune.values;
		this.setCamera({
			target: { x: v.defaultTargetX, y: v.defaultTargetY, z: v.defaultTargetZ }
		});
	}

	/** Restore the default isometric viewing angle (keeps target + zoom). */
	resetCameraOrbit(): void {
		this.cameraOrbitEpoch += 1;
	}

	/** Restore default zoom distance. */
	resetCameraZoom(): void {
		this.setCamera({ distance: worldTune.values.defaultDistance });
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

	setManagerOpen(open: boolean): void {
		this.ui = { ...this.ui, managerOpen: open };
	}

	toggleManager(): void {
		this.setManagerOpen(!this.ui.managerOpen);
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
			if (this.statusMessage.startsWith('Pick another node')) this.statusMessage = '';
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
		this.statusMessage = locked
			? 'Pick another node to connect (directed) · Esc / RMB to cancel'
			: 'Pick another node to connect · hold Alt for directed · Esc / RMB to cancel';
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

	saveToSlot(slot = 'default'): void {
		if (typeof localStorage === 'undefined') return;
		localStorage.setItem(`yggnet.save.${slot}`, serializeDocument(this.document));
		this.statusMessage = 'Saved';
	}

	saveNamedSlot(name: string): void {
		const slot = name.trim();
		if (!slot) {
			this.statusMessage = 'Enter a slot name';
			return;
		}
		this.saveToSlot(slot);
	}

	loadFromSlot(slot = 'default'): void {
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(`yggnet.save.${slot}`);
		if (!raw) {
			this.statusMessage = 'No save found';
			return;
		}
		try {
			this.replaceDocument(parseDocument(raw));
			this.statusMessage = 'Loaded';
		} catch (e) {
			this.statusMessage = e instanceof Error ? e.message : 'Load failed';
		}
	}

	loadNamedSlot(name: string): void {
		const slot = name.trim();
		if (!slot) {
			this.statusMessage = 'Enter a slot name';
			return;
		}
		if (typeof localStorage === 'undefined') return;
		const raw = localStorage.getItem(`yggnet.save.${slot}`);
		if (!raw) {
			this.statusMessage = 'No save found';
			return;
		}
		if (!this.confirmReplaceDocument()) return;
		this.loadFromSlot(slot);
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
		this.setMode('explore');
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

	importJson(json: string): void {
		try {
			this.replaceDocument(parseDocument(json));
			this.statusMessage = 'Imported';
		} catch (e) {
			this.statusMessage = e instanceof Error ? e.message : 'Import failed';
			throw e;
		}
	}

	loadTemplate(kind: 'blank' | 'org' | 'roadmap' | 'learning'): void {
		this.replaceDocument(buildTemplate(kind));
		this.statusMessage = `Template: ${kind}`;
	}

	randomGraph(n = 12): void {
		this.replaceDocument(buildRandomGraph(n));
		this.statusMessage = `Random graph (${n})`;
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
		const pts = path.nodeIds
			.map((id) => this.document.nodes[id]?.position)
			.filter(Boolean) as { x: number; y: number; z: number }[];
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

function place(x: number, y: number, z: number) {
	return { x, y, z };
}

function buildTemplate(kind: 'blank' | 'org' | 'roadmap' | 'learning'): GraphDocument {
	if (kind === 'blank') return createEmptyDocument('Blank');

	let doc = createEmptyDocument(kind === 'org' ? 'Org chart' : kind === 'roadmap' ? 'Roadmap' : 'Learning path');
	const ids: string[] = [];

	const add = (label: string, pos: { x: number; y: number; z: number }, tags: string[] = []) => {
		const r = addNode(doc, { label, position: pos, tags });
		doc = r.doc;
		ids.push(r.nodeId);
		return r.nodeId;
	};
	const link = (from: string, to: string, weight = 1, directed = true) => {
		doc = addEdge(doc, { from, to, weight, directed }).doc;
	};

	if (kind === 'org') {
		const ceo = add('CEO', place(0, 2, 0), ['org', 'lead']);
		const eng = add('Engineering', place(-4, 0, 2), ['org']);
		const des = add('Design', place(4, 0, 2), ['org']);
		const fe = add('Frontend', place(-6, 0, 5), ['org', 'team']);
		const be = add('Backend', place(-2, 0, 5), ['org', 'team']);
		const ux = add('UX', place(2, 0, 5), ['org', 'team']);
		const brand = add('Brand', place(6, 0, 5), ['org', 'team']);
		link(ceo, eng);
		link(ceo, des);
		link(eng, fe);
		link(eng, be);
		link(des, ux);
		link(des, brand);
	} else if (kind === 'roadmap') {
		const a = add('Discover', place(-6, 0, 0), ['phase']);
		const b = add('Prototype', place(-2, 0, 0), ['phase']);
		const c = add('Build', place(2, 0, 0), ['phase']);
		const d = add('Launch', place(6, 0, 0), ['phase']);
		const risk = add('Risk review', place(0, 0, 4), ['gate']);
		link(a, b, 1);
		link(b, c, 2);
		link(c, d, 1);
		link(b, risk, 1);
		link(risk, c, 1);
	} else {
		const root = add('Fundamentals', place(0, 0, -2), ['topic']);
		const graphs = add('Graphs', place(-4, 0, 2), ['topic']);
		const search = add('Search', place(0, 0, 2), ['topic']);
		const path = add('Shortest paths', place(4, 0, 2), ['topic']);
		const bfs = add('BFS', place(-2, 0, 5), ['algo']);
		const dij = add('Dijkstra', place(2, 0, 5), ['algo']);
		const astar = add('A*', place(5, 0, 5), ['algo']);
		link(root, graphs);
		link(root, search);
		link(root, path);
		link(search, bfs);
		link(path, dij);
		link(path, astar);
		link(graphs, search, 1, false);
	}

	return doc;
}

function buildRandomGraph(n: number): GraphDocument {
	const count = Math.max(2, Math.min(40, Math.floor(n)));
	let doc = createEmptyDocument(`Random ${count}`);
	const ids: string[] = [];
	const tune = worldTune.values;
	const placed: { x: number; y: number; z: number }[] = [];
	for (let i = 0; i < count; i++) {
		const angle = (i / count) * Math.PI * 2;
		const ring = 4 + (i % 5);
		const preferred = {
			x: Math.cos(angle) * ring,
			y: tune.defaultNodeY,
			z: Math.sin(angle) * ring
		};
		const position = findFreePosition(
			preferred,
			placed,
			tune.nodeRadius,
			tune.collisionFloorY,
			tune.collisionPadding
		);
		placed.push(position);
		const r = addNode(doc, {
			label: `N${i + 1}`,
			position,
			tags: i % 4 === 0 ? ['hub'] : []
		});
		doc = r.doc;
		ids.push(r.nodeId);
	}
	for (let i = 0; i < count; i++) {
		const to = (i + 1) % count;
		doc = addEdge(doc, {
			from: ids[i],
			to: ids[to],
			weight: 1 + (i % 3),
			directed: i % 5 === 0
		}).doc;
		if (i % 3 === 0) {
			const jump = (i + 3) % count;
			doc = addEdge(doc, { from: ids[i], to: ids[jump], weight: 2, directed: false }).doc;
		}
	}
	return doc;
}

export const app = new AppStore();

/** Convenience re-exports for templates / tests. */
export { AUTOSAVE_KEY, pathIdOf };
