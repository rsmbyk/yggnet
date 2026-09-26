<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import {
		ARCHIMEDEAN_LABELS,
		ARCHIMEDEAN_SOLIDS,
		ATTACHMENTS_FIELD_HELP,
		BRANCHING_FIELD_HELP,
		CHORD_FIELD_HELP,
		COMMUNITY_P_BETWEEN_HELP,
		COMMUNITY_P_INSIDE_HELP,
		DEGREE_FIELD_HELP,
		DENSITY_FIELD_HELP,
		DEPTH_FIELD_HELP,
		DIMENSION_FIELD_HELP,
		EXTENT_FIELD_HELP,
		edgeDirectionOptions,
		edgeDirectionPatch,
		edgeDirectionSelectValue,
		type EdgeDirectionMode,
		fieldsForKind,
		generateFieldLimit,
		generateRequestFromForm,
		GRAPH_KIND_GROUPS,
		kindAllowsDirected,
		kindAllowsPlanar,
		kindAllowsWeighted,
		kindHelp,
		JUMPS_FIELD_HELP,
		NEIGHBORS_FIELD_HELP,
		PALEY_ORDERS,
		pathSeriesMetrics,
		PLATONIC_LABELS,
		PLATONIC_SOLIDS,
		PROBABILITY_RANGE_HELP,
		REWIRE_FIELD_HELP,
		RINGS_FIELD_HELP,
		RUNGS_FIELD_HELP,
		SEGMENTS_FIELD_HELP,
		TURNS_FIELD_HELP,
		nodeMatchesListFilter,
		edgeMatchesListFilter,
		collectDocumentTags,
		collectTagUsage,
		isValidTag
	} from '$lib/graph';
	import type { KindField } from '$lib/graph';
	import { tick } from 'svelte';
	import { toolLabel, type PanelSection } from './tool-ids';
	import { cssLengthToPx, toolsPanelMaxHeight, toolsPanelOverflows } from './tools-panel-limit';
	import TagPicker from './TagPicker.svelte';
	import NodeSearchSelect from './NodeSearchSelect.svelte';

	let { section }: { section: PanelSection } = $props();

	/** Edge row order: explicit locale so it does not follow the host's ICU data. */
	const EDGE_SORT_LOCALE = 'en';
	const EDGE_SORT_OPTIONS: Intl.CollatorOptions = { sensitivity: 'base' };

	let tagsSearchQuery = $state('');
	let tagEditDraft = $state('');
	let stepNote = $state('');
	let nodeSearchQuery = $state('');
	let nodeSearchTags = $state<string[]>([]);
	let nodeSearchNodeIds = $state<string[]>([]);
	let nodeSearchOpen = $state(false);
	let edgeSearchQuery = $state('');
	let edgeSearchTags = $state<string[]>([]);
	let edgeSearchNodeIds = $state<string[]>([]);
	let edgeSearchOpen = $state(false);
	let listSearchRootEl = $state<HTMLDivElement | undefined>(undefined);
	let listSearchFieldEl = $state<HTMLDivElement | undefined>(undefined);
	let edgeSearchInputEl = $state<HTMLInputElement | undefined>(undefined);
	let nodeSearchInputEl = $state<HTMLInputElement | undefined>(undefined);
	let listSearchDropdownStyle = $state('');
	const genFields = $derived(fieldsForKind(app.generateForm.kind));

	function fieldLimit(field: KindField) {
		return generateFieldLimit(app.generateForm.kind, field, {
			nodes: app.generateForm.nodes,
			petersenN: app.generateForm.petersenN
		});
	}

	function onGenerate() {
		const { kind, options } = generateRequestFromForm(app.generateForm);
		app.applyGeneratedGraph(kind, options);
	}

	let compareAlgo = $state('dijkstra');
	let compareRunIdA = $state('');
	let compareRunIdB = $state('');
	let saveSlotName = $state('');
	let panelEl = $state<HTMLElement | undefined>(undefined);
	let headerEl = $state<HTMLElement | undefined>(undefined);
	let bodyEl = $state<HTMLElement | undefined>(undefined);
	let footerEl = $state<HTMLElement | undefined>(undefined);
	let maxHeightPx = $state<number | null>(null);
	let overflowing = $state(false);

	$effect(() => {
		if (section === 'file') app.refreshNamedSlots();
	});

	$effect(() => {
		const el = panelEl;
		const header = headerEl;
		const body = bodyEl;
		if (!el || !header || !body) return;
		const isSelection = section === 'selection' || section === 'tag-edit';
		const expanded = isSelection ? app.ui.selectionPanelExpanded : app.ui.toolsPanelExpanded;
		void genFields;
		void app.generateForm.kind;
		void app.generateForm.binary;
		void selectedId;
		void selectedNode?.tags.length;
		void incidentEdges.length;
		void selectedNode?.notes;
		void nodes.length;
		void edges.length;
		void selectedCount;
		const update = () => {
			const rootSize = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
			const edge =
				cssLengthToPx(getComputedStyle(el).getPropertyValue('--yg-hud-edge'), rootSize) || 12;
			const panelTop = el.getBoundingClientRect().top;
			const dock = el.closest('.tool-dock');
			const dockBottom = dock?.getBoundingClientRect().bottom ?? window.innerHeight - edge;
			const map = document.querySelector('[data-testid="camera-panel"]');
			const minimapTop = map?.getBoundingClientRect().top ?? null;
			const collapsedLimit = toolsPanelMaxHeight({
				panelTop,
				dockBottom,
				minimapTop,
				edge,
				expanded: false
			});
			const limit = toolsPanelMaxHeight({
				panelTop,
				dockBottom,
				minimapTop,
				edge,
				expanded
			});
			const nextMax = `${limit}px`;
			if (el.style.maxHeight !== nextMax) el.style.maxHeight = nextMax;
			const styles = getComputedStyle(el);
			const gap = Number.parseFloat(styles.rowGap || styles.gap) || 0;
			const liveFooter = footerEl?.isConnected ? footerEl : undefined;
			const footerH = liveFooter?.offsetHeight ?? 0;
			const gaps = footerH > 0 ? 2 : 1;
			// Body is the scrollport; scrollHeight is the natural content height.
			const natural = header.offsetHeight + body.scrollHeight + footerH + gap * gaps;
			const nextOverflow = toolsPanelOverflows(natural, collapsedLimit);
			if (nextOverflow !== overflowing) {
				overflowing = nextOverflow;
				void tick().then(schedule);
			}
			if (maxHeightPx !== limit) maxHeightPx = limit;
		};
		let raf = 0;
		const schedule = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(update);
		};
		update();
		void tick().then(schedule);
		const ro = new ResizeObserver(schedule);
		ro.observe(el);
		ro.observe(header);
		ro.observe(body);
		const map = document.querySelector('[data-testid="camera-panel"]');
		if (map) ro.observe(map);
		window.addEventListener('resize', schedule);
		return () => {
			cancelAnimationFrame(raf);
			ro.disconnect();
			window.removeEventListener('resize', schedule);
			el.style.maxHeight = '';
		};
	});

	const nodes = $derived(Object.values(app.document.nodes));
	const allDocumentTags = $derived(collectDocumentTags(app.document));
	const tagUsageList = $derived(collectTagUsage(app.document));
	const tagsListFiltered = $derived.by(() => {
		const q = tagsSearchQuery.trim().toLowerCase();
		if (!q) return tagUsageList;
		return tagUsageList.filter((u) => u.tag.toLowerCase().includes(q));
	});
	const focusTags = $derived(app.filters.tags);
	const focusActive = $derived(focusTags.length > 0);
	const edges = $derived(Object.values(app.document.edges));

	const listSearchActive = $derived(section === 'nodes' || section === 'edges');
	const listSearchQuery = $derived(section === 'edges' ? edgeSearchQuery : nodeSearchQuery);
	const listSearchTags = $derived(section === 'edges' ? edgeSearchTags : nodeSearchTags);
	const listSearchQ = $derived(listSearchQuery.trim().toLowerCase());
	const listSearchOpen = $derived(section === 'edges' ? edgeSearchOpen : nodeSearchOpen);
	const listSearchTagSuggestions = $derived(
		listSearchOpen
			? allDocumentTags
					.filter(
						(t) =>
							!listSearchTags.includes(t) && (!listSearchQ || t.toLowerCase().includes(listSearchQ))
					)
					.slice(0, 40)
			: []
	);
	const edgeNodeSuggestions = $derived(
		section === 'edges' && edgeSearchOpen
			? nodes
					.filter(
						(n) =>
							!edgeSearchNodeIds.includes(n.id) &&
							(!listSearchQ ||
								n.label.toLowerCase().includes(listSearchQ) ||
								n.id.toLowerCase().startsWith(listSearchQ))
					)
					.slice(0, 40)
			: []
	);
	const nodeNodeSuggestions = $derived(
		section === 'nodes' && nodeSearchOpen
			? nodes
					.filter(
						(n) =>
							!nodeSearchNodeIds.includes(n.id) &&
							(!listSearchQ ||
								n.label.toLowerCase().includes(listSearchQ) ||
								n.id.toLowerCase().startsWith(listSearchQ))
					)
					.slice(0, 40)
			: []
	);
	const showListSearchDropdown = $derived(listSearchOpen);
	const filteredNodes = $derived(
		nodes.filter((n) => nodeMatchesListFilter(n, nodeSearchNodeIds, nodeSearchTags))
	);
	const filteredEdges = $derived(
		edges.filter((e) => edgeMatchesListFilter(e, edgeSearchNodeIds, edgeSearchTags))
	);
	const sortedFilteredEdges = $derived(
		[...filteredEdges].sort((a, b) => {
			const aFrom = app.document.nodes[a.from]?.label ?? '?';
			const bFrom = app.document.nodes[b.from]?.label ?? '?';
			// Pin the locale so row order does not vary with the host's ICU data.
			const fromOrder = aFrom.localeCompare(bFrom, EDGE_SORT_LOCALE, EDGE_SORT_OPTIONS);
			if (fromOrder !== 0) return fromOrder;

			const aTo = app.document.nodes[a.to]?.label ?? '?';
			const bTo = app.document.nodes[b.to]?.label ?? '?';
			const toOrder = aTo.localeCompare(bTo, EDGE_SORT_LOCALE, EDGE_SORT_OPTIONS);
			if (toOrder !== 0) return toOrder;

			return a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.id.localeCompare(b.id);
		})
	);
	const nodePickerOptions = $derived(nodes.map((n) => ({ id: n.id, label: n.label })));
	const storedRuns = $derived(Object.values(app.runStore.runs));
	const selectedId = $derived(app.selection.nodeIds[0] ?? null);
	const selectedIds = $derived(new Set(app.selection.nodeIds));
	const selectedCount = $derived(app.selection.nodeIds.length);
	const selectedNode = $derived(selectedId ? app.document.nodes[selectedId] : null);
	const incidentEdges = $derived(
		selectedId ? edges.filter((e) => e.from === selectedId || e.to === selectedId) : []
	);
	const selectedEdgeId = $derived(app.selection.edgeIds[0] ?? null);
	const selectedEdgeIds = $derived(new Set(app.selection.edgeIds));
	const selectedEdgeCount = $derived(app.selection.edgeIds.length);
	const selectedEdge = $derived(selectedEdgeId ? app.document.edges[selectedEdgeId] : null);
	const lastRun = $derived(app.analyze.lastRunId ? app.runStore.runs[app.analyze.lastRunId] : null);
	const traceLen = $derived(lastRun?.trace.length ?? 0);
	const currentStepAnnotation = $derived(lastRun?.annotations?.[app.analyze.stepIndex] ?? '');

	$effect(() => {
		if (!app.analyze.playback || !lastRun || traceLen < 2) return;
		const maxStep = Math.max(0, traceLen - 1);
		if (app.analyze.stepIndex >= maxStep) {
			app.setPlayback(false);
			return;
		}
		const handle = setInterval(() => {
			const idx = app.analyze.stepIndex;
			if (idx >= maxStep) {
				app.setPlayback(false);
				return;
			}
			app.setStepIndex(idx + 1);
		}, 400);
		return () => clearInterval(handle);
	});

	const compareRunA = $derived(
		app.analyze.compareRunIds[0] ? app.runStore.runs[app.analyze.compareRunIds[0]] : null
	);
	const compareRunB = $derived(
		app.analyze.compareRunIds[1] ? app.runStore.runs[app.analyze.compareRunIds[1]] : null
	);

	const edgeWeights = $derived(
		Object.fromEntries(Object.values(app.document.edges).map((e) => [e.id, e.weight]))
	);

	function compareMetrics(run: typeof compareRunA) {
		if (!run || run.result.kind !== 'path') return { hops: 0, cost: 0, nodes: 0 };
		const { hops, cost } = pathSeriesMetrics(run.result.edgeIds, edgeWeights);
		return { hops, cost, nodes: run.result.nodeIds.length };
	}

	function runLabel(run: (typeof storedRuns)[number]): string {
		const stale = run.stale ? ' (stale)' : '';
		return `${run.algorithmId} · ${run.id.slice(0, 8)}…${stale}`;
	}

	$effect(() => {
		const ids = storedRuns.map((r) => r.id);
		if (ids.length === 0) {
			compareRunIdA = '';
			compareRunIdB = '';
			return;
		}
		if (!ids.includes(compareRunIdA)) compareRunIdA = ids[0];
		if (!ids.includes(compareRunIdB)) compareRunIdB = ids.length > 1 ? ids[1] : ids[0];
	});

	const selectionTestId = $derived(
		selectedCount > 1
			? 'world-multi-sheet'
			: selectedCount === 1
				? 'world-node-sheet'
				: selectedEdgeCount > 1
					? 'world-multi-sheet'
					: 'world-edge-sheet'
	);
	const selectionTitle = $derived(
		selectedCount > 1
			? `${selectedCount} nodes`
			: selectedNode
				? selectedNode.label
				: selectedEdgeCount > 1
					? `${selectedEdgeCount} edges`
					: selectedEdge
						? selectedEdge.label?.trim() ||
							`${app.document.nodes[selectedEdge.from]?.label ?? '?'} ${selectedEdge.directed ? '→' : '—'} ${app.document.nodes[selectedEdge.to]?.label ?? '?'}`
						: 'Selection'
	);

	const brandTitle = $derived(
		section === 'selection'
			? selectionTitle
			: section === 'tag-edit'
				? (app.ui.editingTag ?? 'Tag')
				: section === 'nodes'
					? nodes.length > 0
						? `Nodes (${nodes.length})`
						: 'Nodes'
					: section === 'edges'
						? edges.length > 0
							? `Edges (${edges.length})`
							: 'Edges'
						: section === 'tags'
							? 'Tags'
							: toolLabel(section)
	);

	const footerHasActions = $derived(
		section === 'generate' ||
			(section === 'nodes' && selectedCount > 1) ||
			(section === 'edges' && selectedEdgeCount > 1) ||
			(section === 'selection' && Boolean(selectedNode && selectedCount === 1))
	);

	const tagEditOriginal = $derived(app.ui.editingTag);
	const tagEditHelper = $derived.by(() => {
		const original = tagEditOriginal ?? '';
		const draft = tagEditDraft.trim();
		if (!draft || draft === original)
			return { kind: 'neutral' as const, text: 'Use letters, digits, and hyphens only' };
		if (!isValidTag(draft))
			return { kind: 'error' as const, text: 'Use letters, digits, and hyphens only' };
		if (allDocumentTags.includes(draft))
			return { kind: 'error' as const, text: 'Tag already exists' };
		return { kind: 'success' as const, text: 'Available' };
	});
	const tagEditCanSave = $derived(tagEditHelper.kind === 'success');

	$effect(() => {
		const t = app.ui.editingTag;
		if (t !== null) tagEditDraft = t;
	});

	/** Collapse the selection sheet when the primary selected node changes. */
	let lastPrimaryNodeId = $state.raw<string | null | undefined>(undefined);
	$effect(() => {
		const id = selectedId;
		if (lastPrimaryNodeId !== undefined && lastPrimaryNodeId !== id) {
			if (app.ui.selectionPanelExpanded) app.setSelectionPanelExpanded(false);
		}
		lastPrimaryNodeId = id;
	});

	const groupIds = $derived([
		...new Set(
			nodes.map((n) => n.groupId).filter((g): g is string => typeof g === 'string' && g.length > 0)
		)
	]);

	const diffA = $derived(app.ui.diffIds[0] ? app.document.nodes[app.ui.diffIds[0]] : null);
	const diffB = $derived(app.ui.diffIds[1] ? app.document.nodes[app.ui.diffIds[1]] : null);

	function onSelectNode(id: string, ev: MouseEvent) {
		const node = app.document.nodes[id];
		if (app.ui.connectFromId) {
			app.tryConnectTo(id, { altHeld: ev.altKey });
			if (node) app.setCamera({ target: { ...node.position } });
			return;
		}
		const plain = !ev.shiftKey && !ev.ctrlKey && !ev.metaKey;
		if (plain && app.selection.nodeIds.length === 1 && app.selection.nodeIds[0] === id) {
			app.clearAllSelection();
			return;
		}
		const multi = app.selection.nodeIds.length > 1;
		if (ev.shiftKey) app.selectNodeWithModifiers(id, 'add');
		else if (ev.ctrlKey || ev.metaKey) app.selectNodeWithModifiers(id, 'toggle');
		else app.selectNodeWithModifiers(id, multi ? 'add' : 'replace');
		if (node) app.setCamera({ target: { ...node.position } });
	}

	function onSelectEdge(id: string, ev: MouseEvent) {
		const plain = !ev.shiftKey && !ev.ctrlKey && !ev.metaKey;
		if (plain && app.selection.edgeIds.length === 1 && app.selection.edgeIds[0] === id) {
			app.clearAllSelection();
			return;
		}
		const multi = app.selection.edgeIds.length > 1;
		if (ev.shiftKey) app.selectEdgeWithModifiers(id, 'add');
		else if (ev.ctrlKey || ev.metaKey) app.selectEdgeWithModifiers(id, 'toggle');
		else app.selectEdgeWithModifiers(id, multi ? 'add' : 'replace');
	}

	function onEdgeDirectionChange(edgeId: string, mode: EdgeDirectionMode) {
		const edge = app.document.edges[edgeId];
		if (!edge) return;
		app.updateEdge(edgeId, edgeDirectionPatch(edge, mode));
	}

	function onAddNode() {
		app.addNodeNearView();
	}

	function syncListSearchDropdownPosition() {
		const field = listSearchFieldEl;
		if (!field) return;
		const rect = field.getBoundingClientRect();
		listSearchDropdownStyle = `top:${rect.bottom + 4}px;left:${rect.left}px;width:${rect.width}px;`;
	}

	function openListSearch() {
		if (section === 'edges') edgeSearchOpen = true;
		else nodeSearchOpen = true;
		queueMicrotask(() => {
			syncListSearchDropdownPosition();
			if (section === 'edges') edgeSearchInputEl?.focus();
			else nodeSearchInputEl?.focus();
		});
	}

	function closeListSearch() {
		if (section === 'edges') {
			edgeSearchOpen = false;
			edgeSearchQuery = '';
		} else {
			nodeSearchOpen = false;
			nodeSearchQuery = '';
		}
		listSearchDropdownStyle = '';
		queueMicrotask(() => listSearchFieldEl?.focus());
	}

	function toggleListSearch() {
		if (listSearchOpen) closeListSearch();
		else openListSearch();
	}

	function onListSearchFieldClick(e: MouseEvent) {
		const t = e.target;
		if (t instanceof Element && t.closest('.list-search-chip-remove')) return;
		toggleListSearch();
	}

	function onListSearchFieldKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			toggleListSearch();
		}
	}

	function onEdgeSearchFieldClick(e: MouseEvent) {
		onListSearchFieldClick(e);
	}

	function onEdgeSearchFieldKeydown(e: KeyboardEvent) {
		onListSearchFieldKeydown(e);
	}

	function onEdgeSearchRemovePointerDown(e: PointerEvent) {
		e.stopPropagation();
	}

	function addListSearchTag(tag: string) {
		if (section === 'edges') {
			if (edgeSearchTags.includes(tag)) return;
			edgeSearchTags = [...edgeSearchTags, tag];
			edgeSearchQuery = '';
			queueMicrotask(() => edgeSearchInputEl?.focus());
			return;
		}
		if (nodeSearchTags.includes(tag)) return;
		nodeSearchTags = [...nodeSearchTags, tag];
		nodeSearchQuery = '';
		queueMicrotask(() => nodeSearchInputEl?.focus());
	}

	function addEdgeSearchNode(id: string) {
		if (edgeSearchNodeIds.includes(id)) return;
		edgeSearchNodeIds = [...edgeSearchNodeIds, id];
		edgeSearchQuery = '';
		queueMicrotask(() => edgeSearchInputEl?.focus());
	}

	function addNodeSearchNode(id: string) {
		if (nodeSearchNodeIds.includes(id)) return;
		nodeSearchNodeIds = [...nodeSearchNodeIds, id];
		nodeSearchQuery = '';
		queueMicrotask(() => nodeSearchInputEl?.focus());
	}

	function removeListSearchTag(tag: string, e?: MouseEvent) {
		e?.stopPropagation();
		if (section === 'edges') {
			edgeSearchTags = edgeSearchTags.filter((t) => t !== tag);
			return;
		}
		nodeSearchTags = nodeSearchTags.filter((t) => t !== tag);
	}

	function removeEdgeSearchNode(id: string, e?: MouseEvent) {
		e?.stopPropagation();
		edgeSearchNodeIds = edgeSearchNodeIds.filter((n) => n !== id);
	}

	function removeNodeSearchNode(id: string, e?: MouseEvent) {
		e?.stopPropagation();
		nodeSearchNodeIds = nodeSearchNodeIds.filter((n) => n !== id);
	}

	function onListSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			e.stopPropagation();
			closeListSearch();
			return;
		}
		if (e.key === 'Enter') {
			e.preventDefault();
			if (section === 'edges' && edgeNodeSuggestions.length > 0) {
				addEdgeSearchNode(edgeNodeSuggestions[0].id);
				return;
			}
			if (section === 'nodes' && nodeNodeSuggestions.length > 0) {
				addNodeSearchNode(nodeNodeSuggestions[0].id);
				return;
			}
			if (listSearchTagSuggestions.length > 0) {
				addListSearchTag(listSearchTagSuggestions[0]);
			}
			return;
		}
		if (e.key === 'Backspace' && !listSearchQuery) {
			if (section === 'edges') {
				if (edgeSearchTags.length > 0) {
					removeListSearchTag(edgeSearchTags[edgeSearchTags.length - 1]);
					return;
				}
				if (edgeSearchNodeIds.length > 0) {
					removeEdgeSearchNode(edgeSearchNodeIds[edgeSearchNodeIds.length - 1]);
				}
				return;
			}
			if (nodeSearchTags.length > 0) {
				removeListSearchTag(nodeSearchTags[nodeSearchTags.length - 1]);
				return;
			}
			if (nodeSearchNodeIds.length > 0) {
				removeNodeSearchNode(nodeSearchNodeIds[nodeSearchNodeIds.length - 1]);
			}
		}
	}

	$effect(() => {
		if (!showListSearchDropdown) {
			listSearchDropdownStyle = '';
			return;
		}
		syncListSearchDropdownPosition();
		const onDoc = (e: PointerEvent) => {
			if (!listSearchRootEl) return;
			if (e.target instanceof Node && listSearchRootEl.contains(e.target)) return;
			closeListSearch();
		};
		document.addEventListener('pointerdown', onDoc, true);
		window.addEventListener('resize', syncListSearchDropdownPosition);
		window.addEventListener('scroll', syncListSearchDropdownPosition, true);
		return () => {
			document.removeEventListener('pointerdown', onDoc, true);
			window.removeEventListener('resize', syncListSearchDropdownPosition);
			window.removeEventListener('scroll', syncListSearchDropdownPosition, true);
		};
	});

	$effect(() => {
		if (section !== 'edges' && edgeSearchOpen) {
			edgeSearchOpen = false;
			edgeSearchQuery = '';
		}
		if (section !== 'nodes' && nodeSearchOpen) {
			nodeSearchOpen = false;
			nodeSearchQuery = '';
		}
	});

	/** Ego-centric incident edge: current node left; direction relative to it. */
	function incidentEdgeParts(edge: (typeof edges)[number], egoId: string) {
		const fromLabel = app.document.nodes[edge.from]?.label ?? '?';
		const toLabel = app.document.nodes[edge.to]?.label ?? '?';
		const outgoing = edge.from === egoId;
		const otherLabel = outgoing ? toLabel : fromLabel;
		const egoLabel = app.document.nodes[egoId]?.label ?? '?';
		const connector = !edge.directed ? '—' : outgoing ? '→' : '←';
		return { egoLabel, connector, otherLabel };
	}

	function pushDiff(id: string) {
		const cur = [...app.ui.diffIds];
		if (cur.includes(id)) return;
		if (cur.length >= 2) cur.shift();
		cur.push(id);
		app.setDiffIds(cur);
	}
</script>

<aside
	bind:this={panelEl}
	class="manager"
	class:manager--fill={true}
	class:manager--selection={section === 'selection' || section === 'tag-edit'}
	style:max-height={maxHeightPx != null ? `${maxHeightPx}px` : undefined}
	data-testid={section === 'selection'
		? selectionTestId
		: section === 'tag-edit'
			? 'tag-edit-panel'
			: 'yggnet-manager'}
>
	<header class="manager__header" bind:this={headerEl}>
		<div class="manager__header-row">
			<p class="brand">{brandTitle}</p>
			{#if section === 'nodes'}
				<button type="button" class="btn-with-icon" data-testid="add-node" onclick={onAddNode}>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path fill="currentColor" d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" />
					</svg>
					Add node
				</button>
			{:else if section === 'tags'}
				<div class="tags-header-controls">
					<div class="tags-search-field" data-testid="tags-search-field">
						<input
							class="tags-tool-search"
							type="search"
							placeholder="Search tags…"
							aria-label="Search tags"
							data-testid="tags-search"
							bind:value={tagsSearchQuery}
						/>
					</div>
					<button
						type="button"
						class="icon-btn"
						data-testid="tags-focus-reset"
						aria-label="Clear tag focus"
						title="Clear focus"
						disabled={!focusActive}
						onclick={() => app.clearFocusTags()}
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								fill="currentColor"
								d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
							/>
						</svg>
					</button>
				</div>
			{/if}
		</div>
		{#if listSearchActive}
			<div class="list-search" bind:this={listSearchRootEl}>
				{#if section === 'edges'}
					<div
						class="list-search-field"
						class:open={edgeSearchOpen}
						bind:this={listSearchFieldEl}
						role="button"
						tabindex="0"
						data-testid="edges-search-open"
						aria-label="Filter edges"
						aria-expanded={edgeSearchOpen}
						aria-haspopup="listbox"
						onclick={onEdgeSearchFieldClick}
						onkeydown={onEdgeSearchFieldKeydown}
					>
						<div class="list-search-pills">
							{#each edgeSearchNodeIds as id (id)}
								<span class="list-search-chip">
									<span class="list-search-chip-label">{app.document.nodes[id]?.label ?? id}</span>
									<button
										type="button"
										class="list-search-chip-remove"
										tabindex="-1"
										aria-label={`Remove filter node ${app.document.nodes[id]?.label ?? id}`}
										data-testid={`edges-search-node-remove-${id}`}
										onpointerdown={onEdgeSearchRemovePointerDown}
										onclick={(e) => removeEdgeSearchNode(id, e)}>×</button
									>
								</span>
							{/each}
							{#each edgeSearchTags as tag (tag)}
								<span class="list-search-chip">
									<span class="list-search-chip-label">{tag}</span>
									<button
										type="button"
										class="list-search-chip-remove"
										tabindex="-1"
										aria-label={`Remove filter tag ${tag}`}
										data-testid={`list-search-tag-remove-${tag}`}
										onpointerdown={onEdgeSearchRemovePointerDown}
										onclick={(e) => removeListSearchTag(tag, e)}>×</button
									>
								</span>
							{/each}
							{#if edgeSearchNodeIds.length === 0 && edgeSearchTags.length === 0}
								<span class="list-search-empty">Filter…</span>
							{/if}
						</div>
						<svg class="list-search-chevron" viewBox="0 0 12 8" aria-hidden="true">
							<path fill="currentColor" d="M1.2 1.4 6 6.2 10.8 1.4" />
						</svg>
					</div>
					{#if edgeSearchOpen}
						<div
							class="list-search-dropdown"
							role="listbox"
							aria-label="Matching nodes and tags"
							style={listSearchDropdownStyle}
						>
							<input
								bind:this={edgeSearchInputEl}
								class="list-search-dropdown-input"
								type="text"
								placeholder="Search nodes or tags…"
								aria-label="Filter edges"
								data-testid="edges-search"
								bind:value={edgeSearchQuery}
								onkeydown={onListSearchKeydown}
							/>
							<ul class="list-search-results">
								{#if edgeNodeSuggestions.length > 0}
									<li class="list-search-section" role="presentation">Nodes</li>
									{#each edgeNodeSuggestions as n (n.id)}
										<li>
											<button
												type="button"
												class="list-search-option"
												role="option"
												data-testid={`edges-search-node-${n.id}`}
												onclick={() => addEdgeSearchNode(n.id)}>{n.label}</button
											>
										</li>
									{/each}
								{/if}
								{#if listSearchTagSuggestions.length > 0}
									<li class="list-search-section" role="presentation">Tags</li>
									{#each listSearchTagSuggestions as tag (tag)}
										<li>
											<button
												type="button"
												class="list-search-option list-search-option--tag"
												role="option"
												data-testid={`list-search-tag-${tag}`}
												onclick={() => addListSearchTag(tag)}
											>
												<span class="list-search-option-label">{tag}</span>
												<span class="list-search-tag-badge">Tag</span>
											</button>
										</li>
									{/each}
								{/if}
							</ul>
						</div>
					{/if}
				{:else}
					<div
						class="list-search-field"
						class:open={nodeSearchOpen}
						bind:this={listSearchFieldEl}
						role="button"
						tabindex="0"
						data-testid="nodes-search-open"
						aria-label="Filter nodes"
						aria-expanded={nodeSearchOpen}
						aria-haspopup="listbox"
						onclick={onListSearchFieldClick}
						onkeydown={onListSearchFieldKeydown}
					>
						<div class="list-search-pills">
							{#each nodeSearchNodeIds as id (id)}
								<span class="list-search-chip">
									<span class="list-search-chip-label">{app.document.nodes[id]?.label ?? id}</span>
									<button
										type="button"
										class="list-search-chip-remove"
										tabindex="-1"
										aria-label={`Remove filter node ${app.document.nodes[id]?.label ?? id}`}
										data-testid={`nodes-search-node-remove-${id}`}
										onpointerdown={onEdgeSearchRemovePointerDown}
										onclick={(e) => removeNodeSearchNode(id, e)}>×</button
									>
								</span>
							{/each}
							{#each nodeSearchTags as tag (tag)}
								<span class="list-search-chip">
									<span class="list-search-chip-label">{tag}</span>
									<button
										type="button"
										class="list-search-chip-remove"
										tabindex="-1"
										aria-label={`Remove filter tag ${tag}`}
										data-testid={`list-search-tag-remove-${tag}`}
										onpointerdown={onEdgeSearchRemovePointerDown}
										onclick={(e) => removeListSearchTag(tag, e)}>×</button
									>
								</span>
							{/each}
							{#if nodeSearchNodeIds.length === 0 && nodeSearchTags.length === 0}
								<span class="list-search-empty">Filter…</span>
							{/if}
						</div>
						<svg class="list-search-chevron" viewBox="0 0 12 8" aria-hidden="true">
							<path fill="currentColor" d="M1.2 1.4 6 6.2 10.8 1.4" />
						</svg>
					</div>
					{#if nodeSearchOpen}
						<div
							class="list-search-dropdown"
							role="listbox"
							aria-label="Matching nodes and tags"
							style={listSearchDropdownStyle}
						>
							<input
								bind:this={nodeSearchInputEl}
								class="list-search-dropdown-input"
								type="text"
								placeholder="Search nodes or tags…"
								aria-label="Filter nodes"
								data-testid="nodes-search"
								bind:value={nodeSearchQuery}
								onkeydown={onListSearchKeydown}
							/>
							<ul class="list-search-results">
								{#if nodeNodeSuggestions.length > 0}
									<li
										class="list-search-section"
										role="presentation"
										data-testid="nodes-search-group-nodes"
									>
										Nodes
									</li>
									{#each nodeNodeSuggestions as n (n.id)}
										<li>
											<button
												type="button"
												class="list-search-option"
												role="option"
												data-testid={`nodes-search-node-${n.id}`}
												onclick={() => addNodeSearchNode(n.id)}>{n.label}</button
											>
										</li>
									{/each}
								{/if}
								{#if listSearchTagSuggestions.length > 0}
									<li
										class="list-search-section"
										role="presentation"
										data-testid="nodes-search-group-tags"
									>
										Tags
									</li>
									{#each listSearchTagSuggestions as tag (tag)}
										<li>
											<button
												type="button"
												class="list-search-option list-search-option--tag"
												role="option"
												data-testid={`list-search-tag-${tag}`}
												onclick={() => addListSearchTag(tag)}
											>
												<span class="list-search-option-label">{tag}</span>
												<span class="list-search-tag-badge">Tag</span>
											</button>
										</li>
									{/each}
								{/if}
							</ul>
						</div>
					{/if}
				{/if}
			</div>
		{/if}
		{#if section === 'file'}
			<label class="title-field">
				Name
				<input
					class="title-input"
					name="title"
					data-testid="doc-title"
					value={app.document.title}
					oninput={(e) => app.setDocumentTitle(e.currentTarget.value)}
				/>
			</label>
		{/if}
	</header>

	<div class="manager__body" bind:this={bodyEl}>
		{#if section === 'selection'}
			<section
				class="block"
				class:selection-sheet={(selectedNode && selectedCount === 1) ||
					(selectedEdge && selectedEdgeCount === 1)}
				aria-label="Selection"
			>
				{#if selectedNode && selectedCount === 1}
					<div class="selection-sheet-body">
						<label>
							Label
							<input
								data-testid="node-label"
								value={selectedNode.label}
								oninput={(e) => app.updateNode(selectedNode.id, { label: e.currentTarget.value })}
							/>
						</label>
						<div class="pos-stack" data-testid="node-position">
							<h3 class="section-label">Position</h3>
							<div class="pos-axes">
								<label>
									X
									<input
										type="number"
										step="0.1"
										class="no-spinner"
										data-testid="node-pos-x"
										value={selectedNode.position.x}
										oninput={(e) =>
											app.updateNode(selectedNode.id, {
												position: { ...selectedNode.position, x: Number(e.currentTarget.value) }
											})}
									/>
								</label>
								<label>
									Y
									<input
										type="number"
										step="0.1"
										class="no-spinner"
										data-testid="node-pos-y"
										value={selectedNode.position.y}
										oninput={(e) =>
											app.updateNode(selectedNode.id, {
												position: { ...selectedNode.position, y: Number(e.currentTarget.value) }
											})}
									/>
								</label>
								<label>
									Z
									<input
										type="number"
										step="0.1"
										class="no-spinner"
										data-testid="node-pos-z"
										value={selectedNode.position.z}
										oninput={(e) =>
											app.updateNode(selectedNode.id, {
												position: { ...selectedNode.position, z: Number(e.currentTarget.value) }
											})}
									/>
								</label>
							</div>
						</div>
						<div class="field">
							<span class="field-caption">Tags</span>
							<TagPicker
								tags={selectedNode.tags}
								suggestions={allDocumentTags}
								onChange={(next) => app.setNodeTags(selectedNode.id, next)}
							/>
						</div>
						<label>
							Notes
							<textarea
								data-testid="node-notes"
								rows="4"
								value={selectedNode.notes ?? ''}
								oninput={(e) => app.updateNode(selectedNode.id, { notes: e.currentTarget.value })}
							></textarea>
						</label>
						<div class="incident-edges" data-testid="node-incident-edges">
							<h3 class="section-label">Edges ({incidentEdges.length})</h3>
							{#if incidentEdges.length === 0}
								<p class="hint muted">No edges</p>
							{:else}
								<ul class="list incident-edge-list">
									{#each incidentEdges as edge (edge.id)}
										{@const parts = incidentEdgeParts(edge, selectedNode.id)}
										<li class="incident-edge-row">
											<span class="incident-edge-text"
												>{parts.egoLabel} {parts.connector} {parts.otherLabel}</span
											>
											{#if edge.weight !== 1}
												<span class="muted" aria-label={`weight ${edge.weight}`}>{edge.weight}</span
												>
											{/if}
										</li>
									{/each}
								</ul>
							{/if}
						</div>
						{#if app.ui.openTool === null}
							<p class="hint">
								Drag to move · Alt-click connect · Ctrl+Alt directed · Shift add-select · Del to
								delete
							</p>
						{/if}
					</div>
				{:else if selectedCount > 1}
					<div class="row wrap">
						<button type="button" data-testid="group-multi" onclick={() => app.groupSelected()}
							>Group</button
						>
						<button
							type="button"
							data-testid="clear-selection"
							onclick={() => app.clearAllSelection()}>Clear</button
						>
						<button
							type="button"
							class="danger"
							data-testid="world-delete-selection"
							onclick={() => app.deleteSelection()}>Delete</button
						>
					</div>
				{:else if selectedEdge && selectedEdgeCount === 1}
					<div class="selection-sheet-body" data-testid="edge-editor">
						<label>
							Source
							<NodeSearchSelect
								nodes={nodePickerOptions}
								value={selectedEdge.from}
								testid="edge-source"
								ariaLabel="Source"
								onChange={(id) => app.updateEdge(selectedEdge.id, { from: id })}
							/>
						</label>
						<label>
							Destination
							<NodeSearchSelect
								nodes={nodePickerOptions}
								value={selectedEdge.to}
								testid="edge-destination"
								ariaLabel="Destination"
								onChange={(id) => app.updateEdge(selectedEdge.id, { to: id })}
							/>
						</label>
						<label>
							Direction
							{#key `${selectedEdge.from}:${selectedEdge.to}:${selectedEdge.directed}`}
								<select
									data-testid="edge-direction"
									value={edgeDirectionSelectValue(selectedEdge)}
									onchange={(e) =>
										onEdgeDirectionChange(
											selectedEdge.id,
											e.currentTarget.value as EdgeDirectionMode
										)}
								>
									{#each edgeDirectionOptions(app.document.nodes[selectedEdge.from]?.label ?? '?', app.document.nodes[selectedEdge.to]?.label ?? '?') as opt (opt.value)}
										<option value={opt.value}>{opt.label}</option>
									{/each}
								</select>
							{/key}
						</label>
						<label>
							Weight
							<input
								type="number"
								step="0.1"
								class="no-spinner"
								data-testid="edge-weight"
								value={selectedEdge.weight}
								oninput={(e) =>
									app.updateEdge(selectedEdge.id, {
										weight: Number(e.currentTarget.value)
									})}
							/>
						</label>
						<div class="field">
							<span class="field-caption">Tags</span>
							<TagPicker
								tags={selectedEdge.tags ?? []}
								suggestions={allDocumentTags}
								onChange={(next) => app.updateEdge(selectedEdge.id, { tags: next })}
							/>
						</div>
						<label>
							Notes
							<textarea
								data-testid="edge-notes"
								rows="4"
								value={selectedEdge.notes ?? ''}
								oninput={(e) => app.updateEdge(selectedEdge.id, { notes: e.currentTarget.value })}
							></textarea>
						</label>
					</div>
				{/if}
			</section>
		{/if}

		{#if section === 'file'}
			<section class="block file-saves" data-testid="file-saves" aria-label="Saved graphs">
				<h2>Saved graphs</h2>
				<form
					class="row slot-save-row"
					onsubmit={(e) => {
						e.preventDefault();
						if (!saveSlotName.trim()) return;
						app.saveNamedSlot(saveSlotName);
					}}
				>
					<input
						class="slot-name-input"
						type="text"
						placeholder="Slot name"
						data-testid="save-slot-name"
						bind:value={saveSlotName}
						aria-label="Named save slot"
					/>
					<button
						type="submit"
						class="icon-btn"
						data-testid="save-named"
						disabled={!saveSlotName.trim()}
						aria-label="Save"
						title="Save"
					>
						<svg viewBox="0 0 24 24" aria-hidden="true">
							<path
								fill="currentColor"
								d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4zm-5 16a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm3-10H5V5h10v4z"
							/>
						</svg>
					</button>
				</form>
				{#if app.namedSlots.length === 0}
					<p class="hint">No saved graphs yet.</p>
				{:else}
					<ul class="list save-slot-list" data-testid="save-slot-list">
						{#each app.namedSlots as name (name)}
							<li class="row between slot-row" data-testid="save-slot-row" data-slot={name}>
								<span class="slot-label">{name}</span>
								<div class="row">
									<button
										type="button"
										class="icon-btn"
										data-testid="slot-load"
										aria-label="Load"
										title="Load"
										onclick={() => app.loadNamedSlot(name)}
									>
										<svg viewBox="0 0 24 24" aria-hidden="true">
											<path
												fill="currentColor"
												d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"
											/>
										</svg>
									</button>
									<button
										type="button"
										class="icon-btn danger"
										data-testid="slot-delete"
										aria-label="Delete"
										title="Delete"
										onclick={() => app.deleteNamedSlot(name)}
									>
										<svg viewBox="0 0 24 24" aria-hidden="true">
											<path
												fill="currentColor"
												d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
											/>
										</svg>
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		{#if section === 'generate'}
			<section class="block generate-block" data-testid="generate" aria-label="Generate">
				<form
					id="generate-form"
					class="generate-form"
					onsubmit={(e) => {
						e.preventDefault();
						onGenerate();
					}}
				>
					<label>
						Type
						<select
							class="slot-name-input"
							data-testid="generate-kind"
							aria-describedby="generate-kind-help"
							bind:value={app.generateForm.kind}
						>
							{#each GRAPH_KIND_GROUPS as group (group.label)}
								<optgroup label={group.label}>
									{#each group.kinds as item (item.id)}
										<option value={item.id}>{item.label}</option>
									{/each}
								</optgroup>
							{/each}
						</select>
						<p
							class="hint generate-kind-help"
							id="generate-kind-help"
							data-testid="generate-kind-help"
						>
							{kindHelp(app.generateForm.kind)}
						</p>
					</label>
					<div class="generate-fields" data-testid="generate-fields">
						{#if genFields.includes('paleyQ')}
							<label>
								Order q
								<select
									class="slot-name-input"
									data-testid="generate-paley-q"
									bind:value={app.generateForm.paleyQ}
								>
									{#each PALEY_ORDERS as q (q)}
										<option value={q}>{q}</option>
									{/each}
								</select>
							</label>
						{/if}
						{#if genFields.includes('sierpinskiDepth')}
							<label>
								Depth
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('sierpinskiDepth')?.min}
									max={fieldLimit('sierpinskiDepth')?.max}
									bind:value={app.generateForm.sierpinskiDepth}
								/>
							</label>
						{/if}
						{#if genFields.includes('nodes')}
							<label>
								Nodes
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('nodes')?.min}
									data-testid="generate-nodes"
									bind:value={app.generateForm.nodes}
								/>
							</label>
						{/if}
						{#if genFields.includes('density')}
							<label>
								Density
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('density')?.min}
									max={fieldLimit('density')?.max}
									step="0.01"
									data-testid="generate-density"
									aria-describedby="generate-density-help"
									bind:value={app.generateForm.density}
								/>
								<p class="hint" id="generate-density-help" data-testid="generate-density-help">
									{DENSITY_FIELD_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('extraEdges')}
							<label>
								Edges
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('extraEdges')?.min}
									max={fieldLimit('extraEdges')?.max}
									bind:value={app.generateForm.extraEdges}
								/>
							</label>
						{/if}
						{#if genFields.includes('degree')}
							<label>
								Degree
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('degree')?.min}
									max={fieldLimit('degree')?.max}
									aria-describedby="generate-degree-help"
									bind:value={app.generateForm.degree}
								/>
								<p class="hint" id="generate-degree-help" data-testid="generate-degree-help">
									{DEGREE_FIELD_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('depth')}
							<label>
								Depth
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('depth')?.min}
									max={fieldLimit('depth')?.max}
									aria-describedby="generate-depth-help"
									bind:value={app.generateForm.depth}
								/>
								<p class="hint" id="generate-depth-help">{DEPTH_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('branching') && !app.generateForm.binary}
							<label>
								Branching
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('branching')?.min}
									max={fieldLimit('branching')?.max}
									aria-describedby="generate-branching-help"
									bind:value={app.generateForm.branching}
								/>
								<p class="hint" id="generate-branching-help">{BRANCHING_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('left')}
							<label>
								Left
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('left')?.min}
									bind:value={app.generateForm.left}
								/>
							</label>
						{/if}
						{#if genFields.includes('right')}
							<label>
								Right
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('right')?.min}
									bind:value={app.generateForm.right}
								/>
							</label>
						{/if}
						{#if genFields.includes('attachments')}
							<label>
								Attachments
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('attachments')?.min}
									max={fieldLimit('attachments')?.max}
									aria-describedby="generate-attachments-help"
									bind:value={app.generateForm.attachments}
								/>
								<p
									class="hint"
									id="generate-attachments-help"
									data-testid="generate-attachments-help"
								>
									{ATTACHMENTS_FIELD_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('neighbors')}
							<label>
								Neighbors
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('neighbors')?.min}
									max={fieldLimit('neighbors')?.max}
									aria-describedby={app.generateForm.kind === 'smallWorld'
										? 'generate-neighbors-help'
										: undefined}
									bind:value={app.generateForm.neighbors}
								/>
								{#if app.generateForm.kind === 'smallWorld'}
									<p
										class="hint"
										id="generate-neighbors-help"
										data-testid="generate-neighbors-help"
									>
										{NEIGHBORS_FIELD_HELP}
									</p>
								{/if}
							</label>
						{/if}
						{#if genFields.includes('rewire')}
							<label>
								Rewire
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('rewire')?.min}
									max={fieldLimit('rewire')?.max}
									step="0.01"
									data-testid="generate-rewire"
									aria-describedby="generate-rewire-help"
									bind:value={app.generateForm.rewire}
								/>
								<p class="hint" id="generate-rewire-help" data-testid="generate-rewire-help">
									{REWIRE_FIELD_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('jumps')}
							<label>
								Jumps
								<input
									class="slot-name-input"
									bind:value={app.generateForm.jumps}
									aria-label="Circulant jumps"
									aria-describedby="generate-jumps-help"
								/>
								<p class="hint" id="generate-jumps-help">{JUMPS_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('rungs')}
							<label>
								Rungs
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('rungs')?.min}
									max={fieldLimit('rungs')?.max}
									aria-describedby="generate-rungs-help"
									bind:value={app.generateForm.rungs}
								/>
								<p class="hint" id="generate-rungs-help" data-testid="generate-rungs-help">
									{RUNGS_FIELD_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('rows')}
							<label>
								Rows
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('rows')?.min}
									max={fieldLimit('rows')?.max}
									data-testid="generate-rows"
									bind:value={app.generateForm.rows}
								/>
							</label>
						{/if}
						{#if genFields.includes('columns')}
							<label>
								Columns
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('columns')?.min}
									max={fieldLimit('columns')?.max}
									data-testid="generate-columns"
									bind:value={app.generateForm.columns}
								/>
							</label>
						{/if}
						{#if genFields.includes('layers')}
							<label>
								Layers
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('layers')?.min}
									max={fieldLimit('layers')?.max}
									bind:value={app.generateForm.layers}
								/>
							</label>
						{/if}
						{#if genFields.includes('radius')}
							<label>
								Radius
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('radius')?.min}
									step="0.2"
									bind:value={app.generateForm.radius}
								/>
							</label>
						{/if}
						{#if genFields.includes('groups')}
							<label>
								Groups
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('groups')?.min}
									max={fieldLimit('groups')?.max}
									data-testid="generate-groups"
									bind:value={app.generateForm.groups}
								/>
							</label>
						{/if}
						{#if genFields.includes('pInside')}
							<label>
								p inside
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('pInside')?.min}
									max={fieldLimit('pInside')?.max}
									step="0.01"
									aria-describedby="generate-p-inside-help"
									bind:value={app.generateForm.pInside}
								/>
								<p
									class="hint generate-kind-help"
									id="generate-p-inside-help"
									data-testid="generate-p-inside-help"
								>
									{COMMUNITY_P_INSIDE_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('pBetween')}
							<label>
								p between
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('pBetween')?.min}
									max={fieldLimit('pBetween')?.max}
									step="0.01"
									aria-describedby="generate-p-between-help"
									bind:value={app.generateForm.pBetween}
								/>
								<p
									class="hint generate-kind-help"
									id="generate-p-between-help"
									data-testid="generate-p-between-help"
								>
									{COMMUNITY_P_BETWEEN_HELP}
								</p>
							</label>
						{/if}
						{#if genFields.includes('nGons')}
							<label>
								Sides
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('nGons')?.min}
									max={fieldLimit('nGons')?.max}
									bind:value={app.generateForm.nGons}
								/>
							</label>
						{/if}
						{#if genFields.includes('dimension')}
							<label>
								Dimension
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('dimension')?.min}
									max={fieldLimit('dimension')?.max}
									aria-describedby="generate-dimension-help"
									bind:value={app.generateForm.dimension}
								/>
								<p class="hint" id="generate-dimension-help">{DIMENSION_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('platonic')}
							<label>
								Solid
								<select class="slot-name-input" bind:value={app.generateForm.platonic}>
									{#each PLATONIC_SOLIDS as id (id)}
										<option value={id}>{PLATONIC_LABELS[id]}</option>
									{/each}
								</select>
							</label>
						{/if}
						{#if genFields.includes('archimedean')}
							<label>
								Solid
								<select class="slot-name-input" bind:value={app.generateForm.archimedean}>
									{#each ARCHIMEDEAN_SOLIDS as id (id)}
										<option value={id}>{ARCHIMEDEAN_LABELS[id]}</option>
									{/each}
								</select>
							</label>
						{/if}
						{#if genFields.includes('extent')}
							<label>
								Extent
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('extent')?.min}
									max={fieldLimit('extent')?.max}
									aria-describedby="generate-extent-help"
									bind:value={app.generateForm.extent}
								/>
								<p class="hint" id="generate-extent-help">{EXTENT_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('turns')}
							<label>
								Turns
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('turns')?.min}
									step="0.5"
									aria-describedby="generate-turns-help"
									bind:value={app.generateForm.turns}
								/>
								<p class="hint" id="generate-turns-help">{TURNS_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('chord')}
							<label>
								Chord
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('chord')?.min}
									max={fieldLimit('chord')?.max}
									aria-describedby="generate-chord-help"
									bind:value={app.generateForm.chord}
								/>
								<p class="hint" id="generate-chord-help">{CHORD_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('rings')}
							<label>
								Rings
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('rings')?.min}
									max={fieldLimit('rings')?.max}
									aria-describedby="generate-rings-help"
									bind:value={app.generateForm.rings}
								/>
								<p class="hint" id="generate-rings-help">{RINGS_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('segments')}
							<label>
								Segments
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('segments')?.min}
									max={fieldLimit('segments')?.max}
									aria-describedby="generate-segments-help"
									bind:value={app.generateForm.segments}
								/>
								<p class="hint" id="generate-segments-help">{SEGMENTS_FIELD_HELP}</p>
							</label>
						{/if}
						{#if genFields.includes('petersenN')}
							<label>
								n
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('petersenN')?.min}
									max={fieldLimit('petersenN')?.max}
									bind:value={app.generateForm.petersenN}
								/>
							</label>
						{/if}
						{#if genFields.includes('petersenK')}
							<label>
								k
								<input
									class="slot-name-input"
									type="number"
									min={fieldLimit('petersenK')?.min}
									max={fieldLimit('petersenK')?.max}
									bind:value={app.generateForm.petersenK}
								/>
							</label>
						{/if}
					</div>
					<div class="generate-checks">
						{#if genFields.includes('loops')}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.loops} /> Loops</label
							>
						{/if}
						{#if genFields.includes('transitive')}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.transitive} /> Transitive</label
							>
						{/if}
						{#if genFields.includes('binary')}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.binary} /> Binary</label
							>
						{/if}
						{#if genFields.includes('fan')}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.fan} /> Fan</label
							>
						{/if}
						{#if genFields.includes('diagonals')}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.diagonals} /> Diagonals</label
							>
						{/if}
						{#if kindAllowsDirected(app.generateForm.kind)}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.directed} /> Directed</label
							>
						{/if}
						{#if kindAllowsWeighted(app.generateForm.kind)}
							<label class="check"
								><input type="checkbox" bind:checked={app.generateForm.weighted} /> Weighted</label
							>
						{/if}
						{#if kindAllowsPlanar(app.generateForm.kind)}
							<label class="check"
								><input
									type="checkbox"
									data-testid="generate-planar"
									bind:checked={app.generateForm.planar}
								/> 2D</label
							>
						{/if}
					</div>
				</form>
			</section>
		{/if}

		{#if section === 'nodes'}
			<section class="block node-panel" data-testid="nodes-section">
				<ul class="list node-list" data-testid="node-list">
					{#each filteredNodes as node (node.id)}
						<li class="node-row">
							<button
								type="button"
								class="list-item"
								class:selected={selectedIds.has(node.id)}
								data-testid={`node-item-${node.id}`}
								onclick={(e) => onSelectNode(node.id, e)}
							>
								<span class="node-list-label">{node.label}</span>
							</button>
							<button
								type="button"
								class="icon-btn danger"
								data-testid={`delete-node-row-${node.id}`}
								aria-label={`Delete ${node.label}`}
								onclick={(e) => {
									e.stopPropagation();
									app.removeNode(node.id);
								}}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path
										fill="currentColor"
										d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
									/>
								</svg>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if section === 'edges'}
			<section class="block edge-panel" data-testid="edges-section">
				<ul class="list edge-list" data-testid="edge-list">
					{#each sortedFilteredEdges as edge (edge.id)}
						<li class="node-row">
							<button
								type="button"
								class="list-item edge-select"
								class:selected={selectedEdgeIds.has(edge.id)}
								data-testid={`edge-item-${edge.id}`}
								onclick={(e) => onSelectEdge(edge.id, e)}
							>
								<span class="node-list-label">
									{app.document.nodes[edge.from]?.label ?? '?'}
									{edge.directed ? '→' : '—'}
									{app.document.nodes[edge.to]?.label ?? '?'}
								</span>
								{#if edge.weight !== 1}
									<span class="edge-weight-pill">{edge.weight}</span>
								{/if}
							</button>
							<button
								type="button"
								class="icon-btn danger"
								data-testid={`delete-edge-${edge.id}`}
								aria-label="Delete edge"
								onclick={(e) => {
									e.stopPropagation();
									app.removeEdge(edge.id);
								}}
							>
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<path
										fill="currentColor"
										d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
									/>
								</svg>
							</button>
						</li>
					{/each}
				</ul>
			</section>
		{/if}

		{#if section === 'tags'}
			<section class="block" data-testid="tags-section">
				{#if tagsListFiltered.length === 0}
					<p class="hint muted" data-testid="tags-empty">
						{tagUsageList.length === 0 ? 'No tags yet' : 'No tags match'}
					</p>
				{:else}
					<ul class="list tags-tool-list" data-testid="tags-list">
						{#each tagsListFiltered as row (row.tag)}
							{@const inFocus = focusTags.includes(row.tag)}
							<li
								class="tags-tool-row"
								class:focused={focusActive && inFocus}
								class:dimmed={focusActive && !inFocus}
								class:editing={app.ui.editingTag === row.tag}
								data-testid={`tags-row-${row.tag}`}
							>
								<button
									type="button"
									class="tags-tool-row-main"
									data-testid={`tags-row-open-${row.tag}`}
									onclick={() => app.toggleEditingTag(row.tag)}
								>
									<span class="tags-tool-label">{row.tag}</span>
									<span class="tags-tool-meta muted"
										>{row.nodeCount} Nodes · {row.edgeCount} Edges</span
									>
								</button>
								<div class="tags-tool-actions">
									<button
										type="button"
										class="icon-btn"
										data-testid={`tags-show-only-${row.tag}`}
										aria-label={`Show only ${row.tag}`}
										title="Show only this"
										onclick={() => app.showOnlyFocusTag(row.tag)}
									>
										<svg viewBox="0 0 24 24" aria-hidden="true">
											<path
												fill="currentColor"
												d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zM12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"
											/>
										</svg>
									</button>
									<button
										type="button"
										class="icon-btn"
										data-testid={`tags-toggle-focus-${row.tag}`}
										aria-label={inFocus
											? `Remove ${row.tag} from focus`
											: `Add ${row.tag} to focus`}
										title={inFocus ? 'Remove from focus' : 'Add to focus'}
										onclick={() => app.toggleFocusTag(row.tag)}
									>
										{#if inFocus}
											<svg viewBox="0 0 24 24" aria-hidden="true">
												<path fill="currentColor" d="M19 13H5v-2h14v2z" />
											</svg>
										{:else}
											<svg viewBox="0 0 24 24" aria-hidden="true">
												<path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
											</svg>
										{/if}
									</button>
									<button
										type="button"
										class="icon-btn danger-icon"
										data-testid={`tags-delete-${row.tag}`}
										aria-label={`Delete tag ${row.tag}`}
										title="Delete"
										onclick={() => app.deleteDocumentTag(row.tag)}
									>
										<svg viewBox="0 0 24 24" aria-hidden="true">
											<path
												fill="currentColor"
												d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
											/>
										</svg>
									</button>
								</div>
							</li>
						{/each}
					</ul>
				{/if}
			</section>
		{/if}

		{#if section === 'tag-edit' && tagEditOriginal}
			<section class="block selection-sheet" data-testid="tag-edit-section">
				<div class="selection-sheet-body">
					<label>
						Tag label
						<input
							type="text"
							data-testid="tag-edit-input"
							bind:value={tagEditDraft}
							aria-invalid={tagEditHelper.kind === 'error'}
							aria-describedby="tag-edit-helper"
						/>
					</label>
					<p
						id="tag-edit-helper"
						class="field-helper"
						class:error={tagEditHelper.kind === 'error'}
						class:success={tagEditHelper.kind === 'success'}
						data-testid="tag-edit-helper"
					>
						{tagEditHelper.text}
					</p>
					<button
						type="button"
						data-testid="tag-edit-save"
						disabled={!tagEditCanSave}
						onclick={() => app.renameDocumentTag(tagEditOriginal, tagEditDraft)}
					>
						Save
					</button>
				</div>
			</section>
		{/if}

		{#if section === 'groups'}
			<section class="block" data-testid="groups-section">
				<h2>Groups</h2>
				{#if groupIds.length}
					{#each groupIds as gid (gid)}
						<div class="row" data-testid={`group-row-${gid}`}>
							<span class="muted">{gid.slice(0, 8)}…</span>
							{#if app.groupsCollapsed.has(gid)}
								<button
									type="button"
									data-testid={`expand-group-${gid}`}
									onclick={() => app.toggleCollapseGroup(gid)}>Expand</button
								>
							{:else}
								<button
									type="button"
									data-testid={`collapse-group-${gid}`}
									onclick={() => app.toggleCollapseGroup(gid)}>Collapse</button
								>
							{/if}
							<button type="button" data-testid={`ungroup-${gid}`} onclick={() => app.ungroup(gid)}
								>Ungroup</button
							>
						</div>
					{/each}
				{:else}
					<p class="hint">No groups yet.</p>
				{/if}
			</section>
		{/if}

		{#if section === 'pathfinder'}
			<section class="block" data-testid="directions-panel">
				<h2>Pathfinder</h2>
				<div class="row">
					<select
						data-testid="path-from"
						aria-label="Path from"
						value={app.directions.fromId ?? ''}
						onchange={(e) =>
							app.setDirectionsEndpoints(e.currentTarget.value || null, app.directions.toId)}
					>
						<option value="">From A</option>
						{#each nodes as n (n.id)}
							<option value={n.id}>{n.label}</option>
						{/each}
					</select>
					<select
						data-testid="path-to"
						aria-label="Path to"
						value={app.directions.toId ?? ''}
						onchange={(e) =>
							app.setDirectionsEndpoints(app.directions.fromId, e.currentTarget.value || null)}
					>
						<option value="">To B</option>
						{#each nodes as n (n.id)}
							<option value={n.id}>{n.label}</option>
						{/each}
					</select>
				</div>
				<div class="row">
					<button
						type="button"
						data-testid="path-mode-all"
						class:active={app.directions.pathMode === 'all'}
						onclick={() => app.setPathMode('all')}>All</button
					>
					<button
						type="button"
						data-testid="path-mode-shortest"
						class:active={app.directions.pathMode === 'shortest'}
						onclick={() => app.setPathMode('shortest')}>Shortest</button
					>
					<button type="button" data-testid="refresh-paths" onclick={() => app.refreshPaths()}
						>Refresh</button
					>
				</div>
				<ul class="list" data-testid="path-list">
					{#each app.directions.pathList as path, i (app.pathKey(path, i))}
						<li>
							<button
								type="button"
								class="list-item"
								class:selected={app.directions.selectedPathId === app.pathKey(path, i)}
								data-testid={`path-${i}`}
								onclick={() => app.selectPath(app.pathKey(path, i))}
							>
								{path.nodeIds.map((id) => app.document.nodes[id]?.label ?? '?').join(' → ')}
							</button>
						</li>
					{/each}
				</ul>
				{#if app.directions.selectedPathId}
					<div class="row">
						<button type="button" data-testid="start-travel" onclick={() => app.startTravel()}
							>Travel</button
						>
						<button type="button" data-testid="stop-travel" onclick={() => app.stopTravel()}
							>Stop</button
						>
					</div>
					<label>
						Progress
						<input
							type="range"
							min="0"
							max="1"
							step="0.01"
							data-testid="travel-progress"
							aria-describedby="travel-progress-help"
							value={app.directions.travelProgress}
							oninput={(e) => app.setTravelProgress(Number(e.currentTarget.value))}
						/>
						<p class="hint" id="travel-progress-help" data-testid="travel-progress-help">
							{PROBABILITY_RANGE_HELP}
						</p>
					</label>
				{/if}
			</section>
		{/if}

		{#if section === 'analyze'}
			<section class="block" data-testid="analyze-panel">
				<h2>Analyze</h2>
				<label>
					Algorithm
					<select
						data-testid="algo-picker"
						value={app.analyze.algorithmId}
						onchange={(e) => app.setAlgorithm(e.currentTarget.value)}
					>
						{#each app.algorithms as algo (algo.id)}
							<option value={algo.id}>{algo.name}</option>
						{/each}
					</select>
				</label>
				<p class="hint">
					{app.algorithms.find((a) => a.id === app.analyze.algorithmId)?.description}
				</p>
				<div class="row wrap">
					<button type="button" data-testid="run-algo" onclick={() => app.runAlgorithm()}
						>Run</button
					>
					<select
						data-testid="compare-algo"
						bind:value={compareAlgo}
						aria-label="Compare algorithm"
					>
						{#each app.algorithms as algo (algo.id)}
							<option value={algo.id}>{algo.name}</option>
						{/each}
					</select>
					<button
						type="button"
						data-testid="compare-algos"
						onclick={() => app.compareAlgorithms(compareAlgo)}>Compare</button
					>
				</div>
				{#if compareRunA && compareRunB}
					<section class="compare-panel" data-testid="compare-panel">
						<h3>Compare</h3>
						<div class="diff">
							<div data-testid="compare-series-a">
								<strong class="series-a">{compareRunA.algorithmId}</strong>
								{#if compareRunA.stale}<span class="tag">stale</span>{/if}
								<p class="muted">
									{compareMetrics(compareRunA).nodes} nodes · {compareMetrics(compareRunA).hops} hops
									· cost
									{compareMetrics(compareRunA).cost}
								</p>
							</div>
							<div data-testid="compare-series-b">
								<strong class="series-b">{compareRunB.algorithmId}</strong>
								{#if compareRunB.stale}<span class="tag">stale</span>{/if}
								<p class="muted">
									{compareMetrics(compareRunB).nodes} nodes · {compareMetrics(compareRunB).hops} hops
									· cost
									{compareMetrics(compareRunB).cost}
								</p>
							</div>
						</div>
						<button type="button" data-testid="clear-compare" onclick={() => app.clearCompare()}
							>Dismiss compare</button
						>
					</section>
				{/if}
				{#if lastRun}
					<p class="hint" data-testid="run-status">
						Run {lastRun.id.slice(0, 8)}… {lastRun.stale ? '(stale)' : ''}
						— {lastRun.result.kind}
					</p>
					<label class="check">
						<input
							type="checkbox"
							data-testid="show-steps"
							checked={app.analyze.showSteps}
							onchange={(e) => app.setShowSteps(e.currentTarget.checked)}
						/>
						Show steps
					</label>
					{#if app.analyze.showSteps}
						<div class="row wrap">
							<button
								type="button"
								data-testid="trace-play"
								disabled={traceLen < 2}
								onclick={() => app.togglePlayback()}
							>
								{app.analyze.playback ? 'Pause' : 'Play'}
							</button>
							<label>
								Step {app.analyze.stepIndex}/{Math.max(0, traceLen - 1)}
								<input
									type="range"
									min="0"
									max={Math.max(0, traceLen - 1)}
									data-testid="step-scrubber"
									value={app.analyze.stepIndex}
									oninput={(e) => {
										app.setPlayback(false);
										app.setStepIndex(Number(e.currentTarget.value));
									}}
								/>
							</label>
						</div>
						<p class="hint" data-testid="step-annotation-display">
							{#if currentStepAnnotation}
								{currentStepAnnotation}
							{:else}
								<span class="muted">No note for this step</span>
							{/if}
						</p>
						<div class="row">
							<input data-testid="step-note" placeholder="Annotate step" bind:value={stepNote} />
							<button
								type="button"
								data-testid="annotate-step"
								onclick={() => {
									app.annotateCurrentStep(stepNote);
									stepNote = '';
								}}>Note</button
							>
						</div>
					{/if}
				{/if}
				{#if storedRuns.length >= 1}
					<div class="compare-runs" data-testid="compare-runs-section">
						<h3 class="subhead">Compare stored runs</h3>
						<div class="row wrap">
							<label>
								Run A
								<select
									data-testid="compare-run-a"
									bind:value={compareRunIdA}
									aria-label="Compare run A"
								>
									{#each storedRuns as run (run.id)}
										<option value={run.id}>{runLabel(run)}</option>
									{/each}
								</select>
							</label>
							<label>
								Run B
								<select
									data-testid="compare-run-b"
									bind:value={compareRunIdB}
									aria-label="Compare run B"
								>
									{#each storedRuns as run (run.id)}
										<option value={run.id}>{runLabel(run)}</option>
									{/each}
								</select>
							</label>
							<button
								type="button"
								data-testid="compare-runs"
								disabled={storedRuns.length < 2 || compareRunIdA === compareRunIdB}
								onclick={() => app.compareRuns(compareRunIdA, compareRunIdB)}>Compare runs</button
							>
						</div>
					</div>
					<details>
						<summary>Run history ({storedRuns.length})</summary>
						<ul class="list">
							{#each storedRuns as run (run.id)}
								<li class="muted" class:stale-run={run.stale}>
									{run.algorithmId}
									{#if run.stale}<span class="tag stale-tag">stale</span>{:else}<span
											class="tag ok-tag">current</span
										>{/if}
									<button
										type="button"
										data-testid="set-compare-run-a"
										onclick={() => {
											compareRunIdA = run.id;
											if (compareRunIdB === run.id && storedRuns.length > 1) {
												compareRunIdB = storedRuns.find((r) => r.id !== run.id)?.id ?? run.id;
											}
										}}>A</button
									>
									<button
										type="button"
										data-testid="set-compare-run-b"
										onclick={() => {
											compareRunIdB = run.id;
											if (compareRunIdA === run.id && storedRuns.length > 1) {
												compareRunIdA = storedRuns.find((r) => r.id !== run.id)?.id ?? run.id;
											}
										}}>B</button
									>
								</li>
							{/each}
						</ul>
					</details>
				{/if}
			</section>
		{/if}

		{#if section === 'diff'}
			<section class="block" data-testid="diff-panel">
				<h2>Diff</h2>
				{#if diffA && diffB}
					<div class="diff">
						<div>
							<strong>{diffA.label}</strong>
							<p class="muted">{diffA.notes ?? '—'}</p>
							<p class="muted">{diffA.tags.join(', ') || 'no tags'}</p>
						</div>
						<div>
							<strong>{diffB.label}</strong>
							<p class="muted">{diffB.notes ?? '—'}</p>
							<p class="muted">{diffB.tags.join(', ') || 'no tags'}</p>
						</div>
					</div>
					<button
						type="button"
						data-testid="diff-path"
						onclick={() => {
							app.setDirectionsEndpoints(diffA.id, diffB.id);
						}}>Path between</button
					>
					<button type="button" onclick={() => app.setDiffIds([])}>Clear</button>
				{:else}
					<p class="hint">Select up to two nodes, then add them here.</p>
					<button
						type="button"
						data-testid="diff-add-selection"
						disabled={app.selection.nodeIds.length === 0}
						onclick={() => {
							for (const id of app.selection.nodeIds.slice(0, 2)) pushDiff(id);
						}}>Add selection</button
					>
				{/if}
			</section>
		{/if}
	</div>

	{#if footerHasActions || overflowing}
		<footer class="manager__footer" bind:this={footerEl}>
			{#if section === 'selection' && selectedNode && selectedCount === 1}
				<div class="row wrap selection-actions">
					<button
						type="button"
						data-testid="world-connect"
						class:active={app.ui.connectFromId === selectedNode.id}
						onclick={() => app.setConnectFrom(selectedNode.id)}>Connect</button
					>
					<button
						type="button"
						class="danger"
						data-testid="world-delete-node"
						onclick={() => app.removeNode(selectedNode.id)}>Delete</button
					>
				</div>
			{/if}
			{#if section === 'generate'}
				<button
					type="submit"
					form="generate-form"
					class="generate-submit"
					data-testid="generate-submit"
					disabled={app.busyKind !== null}>Generate</button
				>
			{/if}
			{#if section === 'nodes' && selectedCount > 1}
				<div class="node-selection-controls">
					<p class="hint" data-testid="selection-count">{selectedCount} selected</p>
					<div class="row wrap">
						<button type="button" data-testid="group-multi" onclick={() => app.groupSelected()}
							>Group {selectedCount}</button
						>
						<button
							type="button"
							data-testid="clear-selection"
							onclick={() => app.clearAllSelection()}>Clear selection</button
						>
						<button
							type="button"
							class="danger"
							data-testid="delete-selection"
							onclick={() => app.deleteSelection()}>Delete</button
						>
					</div>
				</div>
			{/if}
			{#if section === 'edges' && selectedEdgeCount > 1}
				<div class="node-selection-controls">
					<p class="hint" data-testid="edge-selection-count">{selectedEdgeCount} selected</p>
					<div class="row wrap">
						<button
							type="button"
							data-testid="clear-edge-selection"
							onclick={() => app.clearAllSelection()}>Clear selection</button
						>
						<button
							type="button"
							class="danger"
							data-testid="delete-edge-selection"
							onclick={() => app.deleteSelection()}>Delete</button
						>
					</div>
				</div>
			{/if}
			{#if overflowing}
				<button
					type="button"
					class="manager__expand"
					data-testid={section === 'selection'
						? app.ui.selectionPanelExpanded
							? 'selection-panel-collapse'
							: 'selection-panel-expand'
						: app.ui.toolsPanelExpanded
							? 'tools-panel-collapse'
							: 'tools-panel-expand'}
					aria-label={section === 'selection'
						? app.ui.selectionPanelExpanded
							? 'Collapse selection panel'
							: 'Expand selection panel'
						: app.ui.toolsPanelExpanded
							? 'Collapse tools panel'
							: 'Expand tools panel'}
					title={section === 'selection'
						? app.ui.selectionPanelExpanded
							? 'Collapse'
							: 'Expand'
						: app.ui.toolsPanelExpanded
							? 'Collapse'
							: 'Expand'}
					onclick={() =>
						section === 'selection'
							? app.setSelectionPanelExpanded(!app.ui.selectionPanelExpanded)
							: app.setToolsPanelExpanded(!app.ui.toolsPanelExpanded)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						{#if section === 'selection' ? app.ui.selectionPanelExpanded : app.ui.toolsPanelExpanded}
							<path
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6 15l6-6 6 6"
							/>
						{:else}
							<path
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M6 9l6 6 6-6"
							/>
						{/if}
					</svg>
				</button>
			{/if}
		</footer>
	{/if}
</aside>

<style>
	.manager {
		position: relative;
		top: auto;
		right: auto;
		bottom: auto;
		z-index: auto;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding-block: var(--yg-hud-panel-inset);
		padding-inline: 0;
		background: var(--yg-panel-glass-strong);
		border: 1px solid var(--yg-border);
		width: min(22rem, 92vw);
		height: auto;
		max-height: 100%;
		overflow: hidden;
		box-shadow: 0 10px 32px rgba(28, 36, 46, 0.16);
		border-radius: var(--yg-radius-modal);
	}

	.manager--fill {
		min-height: 0;
	}

	.manager--selection {
		overflow: hidden;
	}

	.manager__header {
		flex: 0 0 auto;
		padding-inline: var(--yg-hud-panel-inset);
	}

	.manager__header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.list-search {
		position: relative;
		width: 100%;
		margin-top: 0.4rem;
	}

	.list-search-field {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		min-height: 2rem;
		padding: 0.3rem 0.45rem 0.3rem 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		cursor: text;
		box-sizing: border-box;
	}

	.list-search-field[role='button'] {
		cursor: pointer;
	}

	.list-search-field:hover {
		background: rgba(255, 255, 255, 0.72);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	.list-search-field.open,
	.list-search-field:focus-within {
		border-color: color-mix(in srgb, var(--yg-accent) 45%, var(--yg-border));
		background: rgba(255, 255, 255, 0.72);
	}

	.list-search-field[role='button']:focus-visible {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 55%, transparent);
		outline-offset: 1px;
	}

	.list-search-pills {
		flex: 1 1 auto;
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		min-width: 0;
		align-items: center;
	}

	.list-search-empty {
		font-size: 0.8rem;
		font-weight: 400;
		color: var(--yg-muted);
	}

	.list-search-chevron {
		flex: 0 0 auto;
		width: 0.7rem;
		height: 0.45rem;
		color: var(--yg-muted);
		transition: transform var(--yg-motion-fast, 120ms) var(--yg-ease, ease);
	}

	.list-search-field.open .list-search-chevron {
		transform: rotate(180deg);
		color: var(--yg-accent);
	}

	.list-search-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		max-width: 100%;
		padding: 0.12rem 0.2rem 0.12rem 0.45rem;
		border-radius: var(--yg-radius-pill);
		border: 1px solid var(--yg-border);
		background: rgba(255, 255, 255, 0.55);
		color: var(--yg-fg);
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1.2;
	}

	.list-search-chip-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		line-height: 1.2;
	}

	.list-search-chip-remove {
		display: inline-grid;
		place-items: center;
		width: 1.1rem;
		height: 1.1rem;
		padding: 0;
		border: none;
		border-radius: 50%;
		background: transparent;
		color: var(--yg-muted);
		font-size: 0.85rem;
		line-height: 0;
		cursor: pointer;
	}

	.list-search-chip-remove:hover {
		color: #8b3a3a;
		background: color-mix(in srgb, #8b3a3a 12%, transparent);
	}

	.list-search-dropdown {
		position: fixed;
		z-index: 80;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		max-height: min(16rem, 50vh);
		padding: 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: rgba(244, 246, 248, 0.96);
		box-shadow: 0 8px 20px rgba(15, 22, 32, 0.12);
		box-sizing: border-box;
	}

	.list-search-dropdown-input {
		width: 100%;
		box-sizing: border-box;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 400;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		padding: 0.35rem 0.5rem;
		background: var(--yg-chip);
		color: var(--yg-fg);
	}

	.list-search-dropdown-input:focus {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 55%, transparent);
		outline-offset: 0;
	}

	.list-search-results {
		list-style: none;
		margin: 0;
		padding: 0;
		overflow-y: auto;
		min-height: 0;
		flex: 1 1 auto;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
	}

	.list-search-option {
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 0.8rem;
		font-weight: 400;
		padding: 0.35rem 0.45rem;
		border: 1px solid transparent;
		border-radius: var(--yg-radius-control);
		background: transparent;
		color: var(--yg-fg);
		cursor: pointer;
	}

	.list-search-option:hover {
		background: rgba(255, 255, 255, 0.55);
	}

	.list-search-section {
		padding: 0.15rem 0.45rem 0.05rem;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		color: var(--yg-muted);
		line-height: 1.2;
		pointer-events: none;
	}

	.list-search-results > li + .list-search-section {
		margin-top: 0.4rem;
		padding-top: 0.45rem;
		border-top: 1px solid color-mix(in srgb, var(--yg-border) 85%, transparent);
	}

	.list-search-option--tag {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.list-search-option-label {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.list-search-tag-badge {
		flex: 0 0 auto;
		font-size: 0.65rem;
		font-weight: 600;
		letter-spacing: 0.03em;
		text-transform: uppercase;
		color: var(--yg-muted);
		padding: 0.1rem 0.35rem;
		border-radius: var(--yg-radius-pill);
		border: 1px solid var(--yg-border);
		background: color-mix(in srgb, var(--yg-chip) 80%, transparent);
	}

	.manager__body {
		flex: 1 1 auto;
		min-height: 0;
		overflow-x: hidden;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.manager__body > .block {
		padding-inline: var(--yg-hud-panel-inset);
	}

	.manager__footer {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		padding-inline: var(--yg-hud-panel-inset);
	}

	.manager__expand {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 100%;
		height: 0.7rem;
		margin: 0;
		padding: 0;
		line-height: 0;
		border: none;
		background: transparent;
		color: var(--yg-muted);
		border-radius: var(--yg-radius-control);
		cursor: pointer;
	}

	.manager__expand:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.28);
		color: var(--yg-fg);
	}

	.manager__expand svg {
		width: 0.65rem;
		height: 0.65rem;
		display: block;
	}

	.manager:has(.manager__expand) {
		padding-bottom: 0.05rem;
	}

	.btn-with-icon {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
	}

	.btn-with-icon svg {
		width: 0.95rem;
		height: 0.95rem;
		flex: 0 0 auto;
	}

	.file-saves {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
	}

	.generate-block {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex: 0 0 auto;
		min-width: 0;
	}

	.generate-form {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
		flex: 0 0 auto;
		min-width: 0;
	}

	.generate-form > label {
		margin-bottom: 0;
		flex: 0 0 auto;
	}

	.generate-form .hint {
		margin: 0.2rem 0 0;
	}

	.generate-fields {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		align-items: start;
		gap: 0.35rem 0.45rem;
		min-width: 0;
	}

	.generate-fields label {
		margin-bottom: 0;
		min-width: 0;
	}

	.generate-fields .slot-name-input,
	.generate-form > label .slot-name-input {
		flex: 0 0 auto;
	}

	.generate-fields label:last-child:nth-child(odd) {
		grid-column: 1 / -1;
	}

	.generate-form input[type='number'] {
		appearance: textfield;
		width: 100%;
	}

	.generate-form input[type='number']::-webkit-inner-spin-button,
	.generate-form input[type='number']::-webkit-outer-spin-button {
		appearance: none;
		margin: 0;
	}

	.generate-checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.7rem;
		flex: 0 0 auto;
	}

	.generate-form > button {
		flex: 0 0 auto;
	}

	.generate-form > button.generate-submit {
		align-self: stretch;
		padding: 0.55rem 1rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		background: var(--yg-accent);
		color: #f4f8f9;
		border-color: color-mix(in srgb, var(--yg-accent) 70%, #062e34);
	}

	.generate-form > button.generate-submit:hover:not(:disabled) {
		background: color-mix(in srgb, var(--yg-accent) 88%, #062e34);
		border-color: color-mix(in srgb, var(--yg-accent) 55%, #062e34);
		color: #f4f8f9;
	}

	.generate-form > button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.manager__footer > button.generate-submit {
		align-self: stretch;
		padding: 0.55rem 1rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		background: var(--yg-accent);
		color: #f4f8f9;
		border-color: color-mix(in srgb, var(--yg-accent) 70%, #062e34);
	}

	.manager__footer > button.generate-submit:hover:not(:disabled) {
		background: color-mix(in srgb, var(--yg-accent) 88%, #062e34);
		border-color: color-mix(in srgb, var(--yg-accent) 55%, #062e34);
		color: #f4f8f9;
	}

	.manager__footer > button.generate-submit:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.generate-checks .check {
		margin-bottom: 0;
	}

	.brand {
		margin: 0;
		font-size: 1.05rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--yg-fg);
		flex: 0 0 auto;
	}

	.manager__header-row .btn-with-icon {
		flex: 0 0 auto;
	}

	.title-field {
		margin: 0.35rem 0 0;
	}

	.title-input {
		width: 100%;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		padding: 0.4rem 0.55rem;
		background: var(--yg-chip);
		color: var(--yg-fg);
		font: inherit;
		font-weight: 400;
	}

	button {
		font: inherit;
		font-size: 0.8rem;
		border: 1px solid var(--yg-border);
		background: var(--yg-chip);
		color: var(--yg-fg);
		border-radius: var(--yg-radius-control);
		padding: 0.4rem 0.55rem;
		cursor: pointer;
		transition:
			background var(--yg-motion-fast) var(--yg-ease),
			border-color var(--yg-motion-fast) var(--yg-ease),
			color var(--yg-motion-fast) var(--yg-ease);
	}

	button:hover:not(:disabled):not(.active):not(.selected) {
		background: rgba(255, 255, 255, 0.72);
	}

	button.active {
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.slot-save-row {
		width: 100%;
		margin: 0;
	}

	.slot-name-input {
		flex: 1 1 auto;
		min-width: 0;
		min-height: var(--yg-hud-btn);
		box-sizing: border-box;
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		width: var(--yg-hud-btn);
		height: var(--yg-hud-btn);
		padding: 0;
		flex: 0 0 auto;
	}

	.icon-btn svg {
		width: 1.05rem;
		height: 1.05rem;
		display: block;
	}

	.slot-row {
		width: 100%;
		gap: 0.5rem;
		padding: 0.15rem 0.2rem 0.15rem 0.4rem;
		border-radius: var(--yg-radius-control);
		transition: background var(--yg-motion-fast) var(--yg-ease);
	}

	.slot-row:hover {
		background: rgba(255, 255, 255, 0.28);
	}

	.slot-label {
		min-width: 0;
		flex: 1 1 auto;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.block h2 {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--yg-muted);
		font-weight: 600;
	}

	.node-panel {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.edge-panel {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.node-list,
	.edge-list {
		margin: 0;
		overflow: visible;
	}

	.node-list-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		min-width: 0;
		flex: 1 1 auto;
	}

	.edge-weight-pill {
		flex: 0 0 auto;
		align-self: center;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 0.12rem 0.45rem;
		border-radius: var(--yg-radius-pill);
		border: 1px solid var(--yg-border);
		background: rgba(255, 255, 255, 0.55);
		color: var(--yg-fg);
		font-size: 0.75rem;
		font-weight: 500;
		line-height: 1;
		box-sizing: border-box;
	}

	.list-item.selected .edge-weight-pill {
		background: rgba(255, 255, 255, 0.45);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	.node-row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}

	.node-row .list-item {
		flex: 1 1 auto;
		min-width: 0;
	}

	.node-row .icon-btn {
		flex: 0 0 auto;
		width: var(--yg-hud-btn);
		height: var(--yg-hud-btn);
		padding: 0;
		box-sizing: border-box;
	}

	.node-row .icon-btn svg {
		width: 0.95rem;
		height: 0.95rem;
	}

	.inspect {
		margin-top: 0.1rem;
		padding: 0.65rem 0.7rem 0.55rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-panel);
		background: var(--yg-chip-dim);
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
	}

	.inspect .subhead {
		margin: 0 0 0.4rem;
	}

	.inspect-actions {
		margin: 0 0 0.45rem;
	}

	.row {
		display: flex;
		gap: 0.35rem;
		align-items: center;
	}

	.row.wrap {
		flex-wrap: wrap;
	}

	.row.between {
		justify-content: space-between;
		align-items: center;
	}

	.list {
		list-style: none;
		margin: 0.35rem 0 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
		overflow: visible;
	}

	.list.save-slot-list {
		flex: 0 0 auto;
		min-height: 0;
		max-height: none;
	}

	.list-item {
		width: 100%;
		text-align: left;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.35rem;
	}

	.list-item.selected {
		background: color-mix(in srgb, var(--yg-accent) 42%, rgba(255, 255, 255, 0.55));
		border-color: color-mix(in srgb, var(--yg-accent) 55%, var(--yg-border));
		color: var(--yg-fg);
	}

	.list-item.selected:hover:not(:disabled) {
		background: color-mix(in srgb, var(--yg-accent) 52%, rgba(255, 255, 255, 0.45));
		border-color: color-mix(in srgb, var(--yg-accent) 65%, var(--yg-border));
	}

	label,
	.field {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--yg-fg);
		margin-bottom: 0.4rem;
	}

	.field-caption {
		font: inherit;
		font-size: inherit;
		font-weight: inherit;
		color: inherit;
	}

	label.check {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
		font-weight: 400;
		color: var(--yg-muted);
	}

	input,
	textarea,
	select {
		font: inherit;
		font-size: 0.85rem;
		font-weight: 400;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		padding: 0.35rem 0.5rem;
		background: var(--yg-chip);
		color: var(--yg-fg);
	}

	.selection-sheet textarea {
		resize: none;
	}

	select {
		appearance: none;
		background-color: var(--yg-chip);
		background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'><path fill='%230f1620' d='M1.2 1.4 6 6.2 10.8 1.4'/></svg>");
		background-repeat: no-repeat;
		background-position: right 0.55rem center;
		background-size: 0.7rem 0.45rem;
		padding-right: 1.65rem;
	}

	.tag {
		font-size: 0.7rem;
		color: var(--yg-accent);
	}

	.stale-tag {
		color: #d4893a;
		font-weight: 600;
	}

	.ok-tag {
		color: #2f9e8a;
	}

	.stale-run {
		opacity: 0.85;
	}

	.subhead {
		margin: 0.75rem 0 0.35rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--yg-muted);
		font-weight: 600;
	}

	.compare-runs label {
		margin-bottom: 0;
	}

	.muted {
		color: var(--yg-muted);
		font-size: 0.8rem;
	}

	.hint {
		margin: 0.25rem 0 0.5rem;
		font-size: 0.7rem;
		font-weight: 400;
		line-height: 1.3;
		color: color-mix(in srgb, var(--yg-muted) 62%, var(--yg-panel));
	}

	button.danger {
		color: #8b3a3a;
		border-color: color-mix(in srgb, #8b3a3a 35%, var(--yg-border));
	}

	button.danger:hover:not(:disabled) {
		background: color-mix(in srgb, #8b3a3a 16%, rgba(255, 255, 255, 0.72));
	}

	.diff {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		font-size: 0.85rem;
	}

	.pos-stack {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		width: 100%;
		min-width: 0;
	}

	.pos-axes {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.35rem;
		width: 100%;
		min-width: 0;
	}

	.pos-axes label {
		margin-bottom: 0;
		font-size: 0.7rem;
		font-weight: 500;
		color: var(--yg-muted);
		gap: 0.15rem;
	}

	.pos-axes input {
		width: 100%;
		min-width: 0;
		box-sizing: border-box;
		font-size: 0.8rem;
		padding: 0.3rem 0.4rem;
	}

	input.no-spinner {
		appearance: textfield;
		-moz-appearance: textfield;
	}

	input.no-spinner::-webkit-inner-spin-button,
	input.no-spinner::-webkit-outer-spin-button {
		appearance: none;
		-webkit-appearance: none;
		margin: 0;
	}

	.selection-sheet {
		display: flex;
		flex-direction: column;
		gap: 0.55rem;
	}

	.selection-sheet-body {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
	}

	.selection-sheet-body > label,
	.selection-sheet-body > .field,
	.selection-sheet-body > .pos-stack,
	.selection-sheet-body > .incident-edges,
	.selection-sheet-body > .hint {
		margin-bottom: 0;
	}

	.incident-edges {
		margin-top: 0;
	}

	.pos-stack .section-label,
	.incident-edges .section-label {
		margin: 0 0 0.35rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--yg-fg);
		letter-spacing: normal;
		text-transform: none;
	}

	.node-selection-controls {
		flex: 0 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.node-selection-controls > .hint {
		margin: 0;
		/* Match button content inset (padding + 1px border). */
		padding-inline: calc(0.5rem + 1px);
		font-size: 0.72rem;
		line-height: 1.2;
	}

	.node-selection-controls .row {
		gap: 0.3rem;
	}

	.node-selection-controls button {
		padding: 0.22rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--yg-fg);
		background: color-mix(in srgb, var(--yg-chip) 70%, transparent);
		border-color: color-mix(in srgb, var(--yg-border) 70%, transparent);
	}

	.node-selection-controls button:hover:not(:disabled):not(.active):not(.selected) {
		color: var(--yg-fg);
		background: rgba(255, 255, 255, 0.72);
		border-color: var(--yg-border);
	}

	.node-selection-controls button.danger {
		color: #8b3a3a;
		border-color: color-mix(in srgb, #8b3a3a 28%, var(--yg-border));
		background: color-mix(in srgb, #8b3a3a 6%, var(--yg-chip));
	}

	.node-selection-controls button.danger:hover:not(:disabled) {
		color: #8b3a3a;
		background: color-mix(in srgb, #8b3a3a 14%, rgba(255, 255, 255, 0.72));
		border-color: color-mix(in srgb, #8b3a3a 40%, var(--yg-border));
	}

	.incident-edges .subhead {
		margin: 0 0 0.25rem;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--yg-muted);
		font-weight: 600;
	}

	.incident-edge-list {
		margin: 0;
	}

	.incident-edge-row {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.8rem;
		line-height: 1.2;
		padding: 0.25rem 0.15rem;
		min-height: 1.4rem;
		box-sizing: border-box;
	}

	.incident-edge-text {
		min-width: 0;
	}

	.compare-panel h3 {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--yg-muted);
		font-weight: 600;
	}

	.series-a {
		color: #2f9e8a;
	}

	.series-b {
		color: #d4893a;
	}

	.attachments {
		margin-bottom: 0.5rem;
	}

	.attachment-row {
		display: flex;
		gap: 0.35rem;
		align-items: center;
		font-size: 0.8rem;
	}

	.attachment-name {
		font-weight: 500;
		min-width: 3rem;
	}

	.attachment-preview {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	button.manager__expand {
		border: none;
		background: transparent;
		box-shadow: none;
		padding: 0;
		min-height: 0;
		font-size: 0;
	}

	button.manager__expand:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.28);
		color: var(--yg-fg);
	}

	.tags-header-controls {
		display: flex;
		flex: 1 1 auto;
		align-items: center;
		justify-content: flex-end;
		gap: 0.35rem;
		min-width: 0;
	}

	.tags-search-field {
		flex: 1 1 auto;
		min-width: 0;
		padding: 0.25rem 0.4rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
	}

	.tags-search-field:focus-within {
		border-color: color-mix(in srgb, var(--yg-accent) 55%, var(--yg-border));
		background: rgba(255, 255, 255, 0.72);
	}

	.tags-tool-search {
		width: 100%;
		min-width: 0;
		padding: 0;
		border: 0;
		outline: 0;
		background: transparent;
		color: var(--yg-fg);
		font: inherit;
		font-size: 0.8rem;
	}

	.tags-tool-search:focus-visible {
		outline: none;
	}

	.tags-tool-list {
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.tags-tool-row {
		position: relative;
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		min-height: 5rem;
		padding: 0.55rem 0.55rem 0.45rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		transition:
			opacity var(--yg-motion) var(--yg-ease),
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease);
	}

	.tags-tool-row.focused {
		background: var(--yg-accent-soft);
		border-color: color-mix(in srgb, var(--yg-accent) 40%, var(--yg-border));
	}

	.tags-tool-row.dimmed {
		opacity: 0.45;
	}

	.tags-tool-row.editing {
		outline: 1px solid color-mix(in srgb, var(--yg-accent) 50%, transparent);
	}

	.tags-tool-row-main {
		position: absolute;
		inset: 0;
		z-index: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		justify-content: flex-start;
		gap: 0.15rem;
		width: 100%;
		padding: 0.55rem 0.55rem 0.45rem;
		border: none;
		border-radius: inherit;
		background: transparent;
		text-align: left;
		cursor: pointer;
		color: inherit;
		min-height: 0;
		box-shadow: none;
	}

	.tags-tool-row-main:hover {
		background: transparent;
	}

	.tags-tool-row-main:focus {
		outline: 2px solid color-mix(in srgb, var(--yg-accent) 65%, transparent);
		outline-offset: 1px;
	}

	.tags-tool-label,
	.tags-tool-meta {
		position: relative;
		z-index: 1;
		pointer-events: none;
	}

	.tags-tool-label {
		font-weight: 600;
		font-size: 0.9rem;
	}

	.tags-tool-meta {
		font-size: 0.72rem;
	}

	.tags-tool-actions {
		position: relative;
		z-index: 2;
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.35rem;
	}

	.tags-tool-actions .icon-btn {
		width: 100%;
		height: 1.85rem;
	}

	.danger-icon {
		color: #b54a4a;
	}

	[data-testid='tag-edit-section'] .field-helper {
		margin: 0.25rem 0;
		font-size: 0.75rem;
		color: var(--yg-muted);
	}

	.field-helper.error {
		color: #b54a4a;
	}

	.field-helper.success {
		color: #2f9e8a;
	}
</style>
