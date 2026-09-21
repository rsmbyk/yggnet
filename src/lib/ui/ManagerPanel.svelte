<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import {
		ARCHIMEDEAN_LABELS,
		ARCHIMEDEAN_SOLIDS,
		fieldsForKind,
		generateOptionsFromForm,
		GRAPH_KIND_GROUPS,
		kindAllowsDirected,
		kindAllowsWeighted,
		NAMED_GRAPH_LABELS,
		NAMED_GRAPHS,
		PALEY_ORDERS,
		pathSeriesMetrics,
		PLATONIC_LABELS,
		PLATONIC_SOLIDS
	} from '$lib/graph';
	import type { GraphAttachment } from '$lib/graph';
	import { toolLabel, type PanelSection } from './tool-ids';
	import { cssLengthToPx, toolsPanelMaxHeight, toolsPanelOverflows } from './tools-panel-limit';

	let { section }: { section: PanelSection } = $props();

	let edgeFrom = $state('');
	let edgeTo = $state('');
	let filterInput = $state('');
	let stepNote = $state('');
	const genFields = $derived(fieldsForKind(app.generateForm.kind));

	function onGenerate() {
		app.applyGeneratedGraph(app.generateForm.kind, generateOptionsFromForm(app.generateForm));
	}

	let compareAlgo = $state('dijkstra');
	let compareRunIdA = $state('');
	let compareRunIdB = $state('');
	let attachName = $state('');
	let attachPayload = $state('');
	let edgeAttachName = $state('');
	let edgeAttachPayload = $state('');
	let saveSlotName = $state('');
	let panelEl = $state<HTMLElement | undefined>(undefined);
	let maxHeightPx = $state<number | null>(null);
	let overflowing = $state(false);

	$effect(() => {
		if (section === 'file') app.refreshNamedSlots();
	});

	$effect(() => {
		if (section === 'selection') {
			maxHeightPx = null;
			overflowing = false;
			return;
		}
		const el = panelEl;
		if (!el) return;
		const expanded = app.ui.toolsPanelExpanded;
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
			el.style.maxHeight = `${limit}px`;
			const nested = [...el.querySelectorAll<HTMLElement>('.list')];
			const nestedExtra = nested.reduce(
				(sum, node) => sum + Math.max(0, node.scrollHeight - node.clientHeight),
				0
			);
			overflowing = toolsPanelOverflows(el.scrollHeight + nestedExtra, collapsedLimit);
			maxHeightPx = limit;
		};
		update();
		const ro = new ResizeObserver(update);
		ro.observe(el);
		const map = document.querySelector('[data-testid="camera-panel"]');
		if (map) ro.observe(map);
		window.addEventListener('resize', update);
		return () => {
			ro.disconnect();
			window.removeEventListener('resize', update);
			el.style.maxHeight = '';
		};
	});

	const nodes = $derived(Object.values(app.document.nodes));
	const storedRuns = $derived(Object.values(app.runStore.runs));
	const edges = $derived(Object.values(app.document.edges));
	const selectedId = $derived(app.selection.nodeIds[0] ?? null);
	const selectedIds = $derived(new Set(app.selection.nodeIds));
	const selectedCount = $derived(app.selection.nodeIds.length);
	const selectedNode = $derived(selectedId ? app.document.nodes[selectedId] : null);
	const selectedEdgeId = $derived(app.selection.edgeIds[0] ?? null);
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
				: 'world-edge-sheet'
	);
	const selectionTitle = $derived(
		selectedCount > 1
			? `${selectedCount} nodes`
			: selectedNode
				? selectedNode.label
				: selectedEdge
					? 'Edge'
					: 'Selection'
	);

	const groupIds = $derived([
		...new Set(
			nodes.map((n) => n.groupId).filter((g): g is string => typeof g === 'string' && g.length > 0)
		)
	]);

	const diffA = $derived(app.ui.diffIds[0] ? app.document.nodes[app.ui.diffIds[0]] : null);
	const diffB = $derived(app.ui.diffIds[1] ? app.document.nodes[app.ui.diffIds[1]] : null);

	function onSelectNode(id: string, ev: MouseEvent) {
		if (app.ui.connectFromId) {
			app.tryConnectTo(id, { ctrlHeld: ev.ctrlKey || ev.metaKey });
			return;
		}
		const multi = app.selection.nodeIds.length > 1;
		if (ev.shiftKey) app.selectNodeWithModifiers(id, 'add');
		else if (ev.ctrlKey || ev.metaKey) app.selectNodeWithModifiers(id, 'toggle');
		else app.selectNodeWithModifiers(id, multi ? 'add' : 'replace');
	}

	function onSelectEdge(id: string, ev: MouseEvent) {
		app.toggleEdgeSelection(id, ev.ctrlKey || ev.metaKey || ev.shiftKey);
	}

	function onAddNode() {
		app.addNode({ label: `Node ${nodes.length + 1}` });
	}

	function onAddEdge() {
		if (!edgeFrom || !edgeTo) return;
		app.addEdge(edgeFrom, edgeTo);
		edgeFrom = '';
		edgeTo = '';
	}

	function applyFilter() {
		const tags = filterInput
			.split(',')
			.map((t) => t.trim())
			.filter(Boolean);
		app.setFilterTags(tags);
	}

	function pushDiff(id: string) {
		const cur = [...app.ui.diffIds];
		if (cur.includes(id)) return;
		if (cur.length >= 2) cur.shift();
		cur.push(id);
		app.setDiffIds(cur);
	}

	function addAttachment(
		kind: 'node' | 'edge',
		id: string,
		current: GraphAttachment[],
		name: string,
		payload: string,
		clear: () => void
	) {
		const trimmed = name.trim();
		if (!trimmed) return;
		const next = [...current, { name: trimmed, payload }];
		if (kind === 'node') app.updateNode(id, { attachments: next });
		else app.updateEdge(id, { attachments: next });
		clear();
	}

	function removeAttachment(
		kind: 'node' | 'edge',
		id: string,
		current: GraphAttachment[],
		index: number
	) {
		const next = current.filter((_, i) => i !== index);
		if (kind === 'node') app.updateNode(id, { attachments: next });
		else app.updateEdge(id, { attachments: next });
	}
</script>

<aside
	bind:this={panelEl}
	class="manager"
	class:manager--fill={section !== 'selection'}
	style:max-height={maxHeightPx != null ? `${maxHeightPx}px` : undefined}
	data-testid={section === 'selection' ? selectionTestId : 'yggnet-manager'}
>
	<header class="manager__header">
		<p class="brand">{section === 'selection' ? selectionTitle : toolLabel(section)}</p>
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

	{#if section === 'selection'}
		<section class="block" aria-label="Selection">
			{#if selectedNode && selectedCount === 1}
				<label>
					Label
					<input
						data-testid="world-node-label"
						value={selectedNode.label}
						oninput={(e) => app.updateNode(selectedNode.id, { label: e.currentTarget.value })}
					/>
				</label>
				<div class="row wrap">
					<button
						type="button"
						data-testid="world-connect"
						class:active={app.ui.connectFromId === selectedNode.id}
						onclick={() => app.setConnectFrom(selectedNode.id)}>Connect</button
					>
					<button
						type="button"
						data-testid="world-pin"
						class:active={selectedNode.pinned}
						onclick={() => app.pinNode(selectedNode.id, !selectedNode.pinned)}
						>{selectedNode.pinned ? 'Unpin' : 'Pin'}</button
					>
					<button
						type="button"
						class="danger"
						data-testid="world-delete-node"
						onclick={() => app.removeNode(selectedNode.id)}>Delete</button
					>
				</div>
				<p class="hint">
					Drag to move · Alt-click connect · Ctrl+Alt directed · Shift add-select · Del to delete
				</p>
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
			{:else if selectedEdge}
				<p class="hint">
					{app.document.nodes[selectedEdge.from]?.label ?? '?'}
					{selectedEdge.directed ? '→' : '—'}
					{app.document.nodes[selectedEdge.to]?.label ?? '?'}
				</p>
				<div class="row wrap">
					<button
						type="button"
						data-testid="world-toggle-directed"
						onclick={() => app.updateEdge(selectedEdge.id, { directed: !selectedEdge.directed })}
						>{selectedEdge.directed ? 'Make undirected' : 'Make directed'}</button
					>
					<button
						type="button"
						class="danger"
						data-testid="world-delete-edge"
						onclick={() => app.removeEdge(selectedEdge.id)}>Delete</button
					>
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
				</label>
				<div class="generate-fields">
					{#if genFields.includes('named')}
						<label>
							Named graph
							<select
								class="slot-name-input"
								data-testid="generate-named"
								bind:value={app.generateForm.named}
							>
								{#each NAMED_GRAPHS as id (id)}
									<option value={id}>{NAMED_GRAPH_LABELS[id]}</option>
								{/each}
							</select>
						</label>
					{/if}
					{#if genFields.includes('paleyQ') && app.generateForm.named === 'paley'}
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
					{#if genFields.includes('sierpinskiDepth') && (app.generateForm.named === 'sierpinskiGasket' || app.generateForm.named === 'sierpinskiTetrahedron')}
						<label>
							Depth
							<input
								class="slot-name-input"
								type="number"
								min="0"
								max="2"
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
								min="0"
								max="40"
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
								min="0"
								max="1"
								step="0.05"
								bind:value={app.generateForm.density}
							/>
						</label>
					{/if}
					{#if genFields.includes('extraEdges')}
						<label>
							Edges
							<input
								class="slot-name-input"
								type="number"
								min="0"
								max="80"
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
								min="0"
								max="39"
								bind:value={app.generateForm.degree}
							/>
						</label>
					{/if}
					{#if genFields.includes('depth')}
						<label>
							Depth
							<input
								class="slot-name-input"
								type="number"
								min="1"
								max="8"
								bind:value={app.generateForm.depth}
							/>
						</label>
					{/if}
					{#if genFields.includes('branching') && !app.generateForm.binary}
						<label>
							Branching
							<input
								class="slot-name-input"
								type="number"
								min="2"
								max="6"
								bind:value={app.generateForm.branching}
							/>
						</label>
					{/if}
					{#if genFields.includes('left')}
						<label>
							Left
							<input
								class="slot-name-input"
								type="number"
								min="1"
								max="39"
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
								min="1"
								max="39"
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
								min="1"
								max="5"
								bind:value={app.generateForm.attachments}
							/>
						</label>
					{/if}
					{#if genFields.includes('neighbors')}
						<label>
							Neighbors
							<input
								class="slot-name-input"
								type="number"
								min="1"
								max="20"
								bind:value={app.generateForm.neighbors}
							/>
						</label>
					{/if}
					{#if genFields.includes('rewire')}
						<label>
							Rewire
							<input
								class="slot-name-input"
								type="number"
								min="0"
								max="1"
								step="0.05"
								bind:value={app.generateForm.rewire}
							/>
						</label>
					{/if}
					{#if genFields.includes('jumps')}
						<label>
							Jumps
							<input
								class="slot-name-input"
								bind:value={app.generateForm.jumps}
								aria-label="Circulant jumps"
							/>
						</label>
					{/if}
					{#if genFields.includes('rungs')}
						<label>
							Rungs
							<input
								class="slot-name-input"
								type="number"
								min="3"
								max="20"
								bind:value={app.generateForm.rungs}
							/>
						</label>
					{/if}
					{#if genFields.includes('rows')}
						<label>
							Rows
							<input
								class="slot-name-input"
								type="number"
								min="1"
								max="20"
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
								min="1"
								max="20"
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
								min="1"
								max="10"
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
								min="0.2"
								max="20"
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
								min="2"
								max="8"
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
								min="0"
								max="1"
								step="0.05"
								bind:value={app.generateForm.pInside}
							/>
						</label>
					{/if}
					{#if genFields.includes('pBetween')}
						<label>
							p between
							<input
								class="slot-name-input"
								type="number"
								min="0"
								max="1"
								step="0.05"
								bind:value={app.generateForm.pBetween}
							/>
						</label>
					{/if}
					{#if genFields.includes('nGons')}
						<label>
							Sides
							<input
								class="slot-name-input"
								type="number"
								min="3"
								max="20"
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
								min="2"
								max="5"
								bind:value={app.generateForm.dimension}
							/>
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
								min="1"
								max="4"
								bind:value={app.generateForm.extent}
							/>
						</label>
					{/if}
					{#if genFields.includes('turns')}
						<label>
							Turns
							<input
								class="slot-name-input"
								type="number"
								min="0.5"
								max="8"
								step="0.5"
								bind:value={app.generateForm.turns}
							/>
						</label>
					{/if}
					{#if genFields.includes('chord')}
						<label>
							Chord
							<input
								class="slot-name-input"
								type="number"
								min="0"
								max="39"
								bind:value={app.generateForm.chord}
							/>
						</label>
					{/if}
					{#if genFields.includes('rings')}
						<label>
							Rings
							<input
								class="slot-name-input"
								type="number"
								min="3"
								max="20"
								bind:value={app.generateForm.rings}
							/>
						</label>
					{/if}
					{#if genFields.includes('segments')}
						<label>
							Segments
							<input
								class="slot-name-input"
								type="number"
								min="3"
								max="20"
								bind:value={app.generateForm.segments}
							/>
						</label>
					{/if}
					{#if genFields.includes('petersenN')}
						<label>
							n
							<input
								class="slot-name-input"
								type="number"
								min="3"
								max="20"
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
								min="1"
								max="10"
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
				</div>
				<button type="submit" data-testid="generate-submit">Generate</button>
			</form>
		</section>
	{/if}

	{#if section === 'nodes'}
		<section class="block node-panel" data-testid="nodes-section">
			<div class="row between">
				<h2>Nodes ({nodes.length})</h2>
				<div class="row wrap">
					<button type="button" data-testid="add-node" onclick={onAddNode}>Add node</button>
					<button type="button" data-testid="relayout" onclick={() => app.relayout()}
						>Re-layout</button
					>
				</div>
			</div>
			{#if selectedCount > 0}
				<p class="hint" data-testid="selection-count">{selectedCount} selected</p>
			{/if}
			<ul class="list node-list" data-testid="node-list">
				{#each nodes as node (node.id)}
					<li>
						<button
							type="button"
							class="list-item"
							class:selected={selectedIds.has(node.id)}
							data-testid={`node-item-${node.id}`}
							onclick={(e) => onSelectNode(node.id, e)}
						>
							<span class="node-list-label">{node.label}</span>
							{#if node.pinned}<span class="tag">pin</span>{/if}
						</button>
					</li>
				{/each}
			</ul>
			{#if selectedCount > 1}
				<div class="row wrap">
					<button type="button" data-testid="group-multi" onclick={() => app.groupSelected()}
						>Group {selectedCount}</button
					>
					<button
						type="button"
						data-testid="clear-selection"
						onclick={() => app.clearAllSelection()}>Clear selection</button
					>
					<button type="button" data-testid="delete-selection" onclick={() => app.deleteSelection()}
						>Delete</button
					>
				</div>
			{/if}

			{#if selectedNode && selectedCount === 1}
				<div class="inspect" data-testid="node-editor">
					<h3 class="subhead">Inspect</h3>
					<div class="row wrap inspect-actions">
						<button
							type="button"
							data-testid="node-connect"
							class:active={app.ui.connectFromId === selectedNode.id}
							onclick={() => app.setConnectFrom(selectedNode.id)}>Connect</button
						>
						<button
							type="button"
							data-testid="delete-node"
							onclick={() => app.removeNode(selectedNode.id)}>Delete</button
						>
						<button type="button" data-testid="diff-add" onclick={() => pushDiff(selectedNode.id)}
							>Add to diff</button
						>
					</div>
					<label>
						Label
						<input
							data-testid="node-label"
							value={selectedNode.label}
							oninput={(e) => app.updateNode(selectedNode.id, { label: e.currentTarget.value })}
						/>
					</label>
					<label>
						Notes
						<textarea
							data-testid="node-notes"
							rows="2"
							value={selectedNode.notes ?? ''}
							oninput={(e) => app.updateNode(selectedNode.id, { notes: e.currentTarget.value })}
						></textarea>
					</label>
					<div class="pos-row" data-testid="node-position">
						<label>
							X
							<input
								type="number"
								step="0.1"
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
								data-testid="node-pos-z"
								value={selectedNode.position.z}
								oninput={(e) =>
									app.updateNode(selectedNode.id, {
										position: { ...selectedNode.position, z: Number(e.currentTarget.value) }
									})}
							/>
						</label>
					</div>
					<label>
						Tags
						<input
							data-testid="node-tags"
							placeholder="comma-separated"
							value={selectedNode.tags.join(', ')}
							oninput={(e) =>
								app.setNodeTags(
									selectedNode.id,
									e.currentTarget.value
										.split(',')
										.map((t) => t.trim())
										.filter(Boolean)
								)}
						/>
					</label>
					<label class="check">
						<input
							type="checkbox"
							data-testid="node-pin"
							checked={selectedNode.pinned}
							onchange={(e) => app.pinNode(selectedNode.id, e.currentTarget.checked)}
						/>
						Pinned
					</label>
					<div class="attachments" data-testid="attachments-section">
						<h3 class="subhead">Attachments</h3>
						<ul class="list attachment-list" data-testid="attachment-list">
							{#each selectedNode.attachments as att, i (i)}
								<li class="attachment-row">
									<span class="attachment-name">{att.name}</span>
									<span class="muted attachment-preview"
										>{att.payload.slice(0, 40)}{att.payload.length > 40 ? '…' : ''}</span
									>
									<button
										type="button"
										data-testid={`remove-attachment-${i}`}
										aria-label={`Remove attachment ${att.name}`}
										onclick={() =>
											removeAttachment('node', selectedNode.id, selectedNode.attachments, i)}
										>×</button
									>
								</li>
							{/each}
						</ul>
						<div class="row wrap">
							<input
								data-testid="attachment-name"
								placeholder="Name"
								aria-label="Attachment name"
								bind:value={attachName}
							/>
							<input
								data-testid="attachment-payload"
								placeholder="Text or data URL"
								aria-label="Attachment payload"
								bind:value={attachPayload}
							/>
							<button
								type="button"
								data-testid="add-attachment"
								onclick={() =>
									addAttachment(
										'node',
										selectedNode.id,
										selectedNode.attachments,
										attachName,
										attachPayload,
										() => {
											attachName = '';
											attachPayload = '';
										}
									)}>Add</button
							>
						</div>
					</div>
				</div>
			{/if}
		</section>
	{/if}

	{#if section === 'edges'}
		{#if selectedEdge}
			<section class="block" data-testid="edge-editor">
				<h2>Edit edge</h2>
				<p class="hint">
					{app.document.nodes[selectedEdge.from]?.label ?? '?'}
					{selectedEdge.directed ? '→' : '—'}
					{app.document.nodes[selectedEdge.to]?.label ?? '?'}
				</p>
				<div class="row wrap inspect-actions">
					<button
						type="button"
						data-testid="edge-toggle-directed"
						onclick={() => app.updateEdge(selectedEdge.id, { directed: !selectedEdge.directed })}
						>{selectedEdge.directed ? 'Make undirected' : 'Make directed'}</button
					>
					<button
						type="button"
						data-testid="delete-edge"
						onclick={() => app.removeEdge(selectedEdge.id)}>Delete</button
					>
				</div>
				<div class="attachments" data-testid="edge-attachments-section">
					<h3 class="subhead">Attachments</h3>
					<ul class="list attachment-list" data-testid="edge-attachment-list">
						{#each selectedEdge.attachments as att, i (i)}
							<li class="attachment-row">
								<span class="attachment-name">{att.name}</span>
								<span class="muted attachment-preview"
									>{att.payload.slice(0, 40)}{att.payload.length > 40 ? '…' : ''}</span
								>
								<button
									type="button"
									data-testid={`remove-edge-attachment-${i}`}
									aria-label={`Remove attachment ${att.name}`}
									onclick={() =>
										removeAttachment('edge', selectedEdge.id, selectedEdge.attachments, i)}
									>×</button
								>
							</li>
						{/each}
					</ul>
					<div class="row wrap">
						<input
							data-testid="edge-attachment-name"
							placeholder="Name"
							aria-label="Edge attachment name"
							bind:value={edgeAttachName}
						/>
						<input
							data-testid="edge-attachment-payload"
							placeholder="Text or data URL"
							aria-label="Edge attachment payload"
							bind:value={edgeAttachPayload}
						/>
						<button
							type="button"
							data-testid="add-edge-attachment"
							onclick={() =>
								addAttachment(
									'edge',
									selectedEdge.id,
									selectedEdge.attachments,
									edgeAttachName,
									edgeAttachPayload,
									() => {
										edgeAttachName = '';
										edgeAttachPayload = '';
									}
								)}>Add</button
						>
					</div>
				</div>
			</section>
		{/if}

		<section class="block" data-testid="edges-section">
			<div class="row between">
				<h2>Edges ({edges.length})</h2>
			</div>
			<div class="row">
				<select data-testid="edge-from" bind:value={edgeFrom} aria-label="Edge from">
					<option value="">From</option>
					{#each nodes as n (n.id)}
						<option value={n.id}>{n.label}</option>
					{/each}
				</select>
				<select data-testid="edge-to" bind:value={edgeTo} aria-label="Edge to">
					<option value="">To</option>
					{#each nodes as n (n.id)}
						<option value={n.id}>{n.label}</option>
					{/each}
				</select>
				<button type="button" data-testid="add-edge" onclick={onAddEdge}>Add</button>
			</div>
			<ul class="list" data-testid="edge-list">
				{#each edges as edge (edge.id)}
					<li class="edge-row">
						<button
							type="button"
							class="list-item edge-select"
							class:selected={app.selection.edgeIds.includes(edge.id)}
							data-testid={`edge-item-${edge.id}`}
							onclick={(e) => onSelectEdge(edge.id, e)}
						>
							{app.document.nodes[edge.from]?.label ?? '?'}
							{edge.directed ? '→' : '—'}
							{app.document.nodes[edge.to]?.label ?? '?'}
							<span class="muted">w={edge.weight}</span>
						</button>
						<button
							type="button"
							data-testid={`edit-edge-${edge.id}`}
							onclick={() => {
								const w = Number(prompt('Weight', String(edge.weight)));
								if (!Number.isFinite(w)) return;
								app.updateEdge(edge.id, { weight: w });
							}}>W</button
						>
						<button
							type="button"
							data-testid={`toggle-directed-${edge.id}`}
							onclick={() => app.updateEdge(edge.id, { directed: !edge.directed })}>Dir</button
						>
						<button
							type="button"
							data-testid={`edge-notes-${edge.id}`}
							onclick={() => {
								const notes = prompt('Notes', edge.notes ?? '') ?? edge.notes;
								app.updateEdge(edge.id, { notes: notes ?? '' });
							}}>Notes</button
						>
						{#if selectedId && (edge.from === selectedId || edge.to === selectedId)}
							<button
								type="button"
								data-testid={`follow-edge-${edge.id}`}
								onclick={() => app.followEdge(edge.id)}>Follow</button
							>
						{/if}
						<button
							type="button"
							data-testid={`delete-edge-${edge.id}`}
							onclick={() => app.removeEdge(edge.id)}>×</button
						>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if section === 'filters'}
		<section class="block" data-testid="filters-section">
			<h2>Filters</h2>
			<div class="row">
				<input
					data-testid="filter-tags"
					placeholder="tag1, tag2"
					bind:value={filterInput}
					aria-label="Filter tags"
				/>
				<button type="button" data-testid="apply-filter" onclick={applyFilter}>Apply</button>
			</div>
			<label class="check">
				<input
					type="checkbox"
					data-testid="hide-filtered"
					checked={app.filters.hideFiltered}
					onchange={(e) => app.setHideFiltered(e.currentTarget.checked)}
				/>
				Hide / dim non-matches
			</label>
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
						value={app.directions.travelProgress}
						oninput={(e) => app.setTravelProgress(Number(e.currentTarget.value))}
					/>
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
				<button type="button" data-testid="run-algo" onclick={() => app.runAlgorithm()}>Run</button>
				<select data-testid="compare-algo" bind:value={compareAlgo} aria-label="Compare algorithm">
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
								{compareMetrics(compareRunA).nodes} nodes · {compareMetrics(compareRunA).hops} hops ·
								cost
								{compareMetrics(compareRunA).cost}
							</p>
						</div>
						<div data-testid="compare-series-b">
							<strong class="series-b">{compareRunB.algorithmId}</strong>
							{#if compareRunB.stale}<span class="tag">stale</span>{/if}
							<p class="muted">
								{compareMetrics(compareRunB).nodes} nodes · {compareMetrics(compareRunB).hops} hops ·
								cost
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
				<p class="hint">Add two nodes to the diff from Inspect.</p>
			{/if}
		</section>
	{/if}

	{#if section !== 'selection' && overflowing}
		<button
			type="button"
			class="manager__expand"
			data-testid={app.ui.toolsPanelExpanded ? 'tools-panel-collapse' : 'tools-panel-expand'}
			aria-label={app.ui.toolsPanelExpanded ? 'Collapse tools panel' : 'Expand tools panel'}
			title={app.ui.toolsPanelExpanded ? 'Collapse' : 'Expand'}
			onclick={() => app.setToolsPanelExpanded(!app.ui.toolsPanelExpanded)}
		>
			<svg viewBox="0 0 24 24" aria-hidden="true">
				{#if app.ui.toolsPanelExpanded}
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
		padding: var(--yg-hud-panel-inset);
		background: var(--yg-panel-glass-strong);
		border: 1px solid var(--yg-border);
		width: min(22rem, 92vw);
		height: auto;
		max-height: 100%;
		overflow: auto;
		box-shadow: 0 10px 32px rgba(28, 36, 46, 0.16);
		border-radius: var(--yg-radius-modal);
	}

	.manager--fill {
		min-height: 0;
	}

	.manager__header {
		flex-shrink: 0;
	}

	.manager__expand {
		flex: 0 0 auto;
		display: grid;
		place-items: center;
		width: 100%;
		height: 0.7rem;
		margin: calc(-1 * 0.85rem) 0 0;
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

	.file-saves {
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
	}

	.generate-block {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.generate-form {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
		margin: 0;
	}

	.generate-form > label {
		margin-bottom: 0;
	}

	.generate-fields {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.35rem 0.45rem;
	}

	.generate-fields label {
		margin-bottom: 0;
	}

	.generate-checks {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem 0.7rem;
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

	button:hover:not(:disabled):not(.active) {
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
		flex: 1 1 auto;
		min-height: 0;
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.node-panel > .row.between h2 {
		margin: 0;
	}

	.node-list {
		flex: 1 1 auto;
		min-height: 0;
		max-height: none;
	}

	.node-list-label {
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
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
		overflow: auto;
	}

	.list.save-slot-list {
		flex: 1 1 auto;
		min-height: 0;
		max-height: none;
	}

	.list-item {
		width: 100%;
		text-align: left;
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
	}

	.list-item.selected {
		background: var(--yg-accent-soft);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	label {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.8rem;
		color: var(--yg-muted);
		margin-bottom: 0.4rem;
	}

	label.check {
		flex-direction: row;
		align-items: center;
		gap: 0.4rem;
	}

	input,
	textarea,
	select {
		font: inherit;
		font-size: 0.85rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		padding: 0.35rem 0.5rem;
		background: var(--yg-chip);
		color: var(--yg-fg);
	}

	.edge-row {
		display: flex;
		flex-wrap: wrap;
		gap: 0.25rem;
		align-items: center;
		font-size: 0.8rem;
	}

	.edge-label {
		flex: 1;
		min-width: 6rem;
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
		font-size: 0.75rem;
		color: var(--yg-muted);
		line-height: 1.35;
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

	.pos-row {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 0.35rem;
		margin-bottom: 0.4rem;
	}

	.pos-row label {
		margin-bottom: 0;
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
</style>
