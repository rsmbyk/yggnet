<script lang="ts">
	import { app } from '$lib/session/app.svelte';
	import type { AppMode } from '$lib/graph';

	const modes: { id: AppMode; label: string }[] = [
		{ id: 'explore', label: 'Explore' },
		{ id: 'directions', label: 'Directions' },
		{ id: 'analyze', label: 'Analyze' }
	];

	let edgeFrom = $state('');
	let edgeTo = $state('');
	let filterInput = $state('');
	let stepNote = $state('');
	let randomN = $state(12);
	let compareAlgo = $state('dijkstra');

	const nodes = $derived(Object.values(app.document.nodes));
	const edges = $derived(Object.values(app.document.edges));
	const selectedId = $derived(app.selection.nodeIds[0] ?? null);
	const selectedIds = $derived(new Set(app.selection.nodeIds));
	const selectedCount = $derived(app.selection.nodeIds.length);
	const selectedNode = $derived(selectedId ? app.document.nodes[selectedId] : null);
	const lastRun = $derived(
		app.analyze.lastRunId ? app.runStore.runs[app.analyze.lastRunId] : null
	);
	const traceLen = $derived(lastRun?.trace.length ?? 0);

	const groupIds = $derived(
		[
			...new Set(
				nodes.map((n) => n.groupId).filter((g): g is string => typeof g === 'string' && g.length > 0)
			)
		]
	);

	const diffA = $derived(
		app.ui.diffIds[0] ? app.document.nodes[app.ui.diffIds[0]] : null
	);
	const diffB = $derived(
		app.ui.diffIds[1] ? app.document.nodes[app.ui.diffIds[1]] : null
	);

	function onSelectNode(id: string, ev: MouseEvent) {
		app.selectNodeWithModifiers(id, ev.ctrlKey || ev.metaKey || ev.shiftKey);
	}

	function onSelectEdge(id: string, ev: MouseEvent) {
		app.toggleEdgeSelection(id, ev.ctrlKey || ev.metaKey || ev.shiftKey);
	}

	function setMode(mode: AppMode) {
		app.setMode(mode);
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

	function onImportFile(ev: Event) {
		const input = ev.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;
		file.text().then((text) => {
			try {
				app.importJson(text);
			} catch {
				/* status set in store */
			}
			input.value = '';
		});
	}

	function pushDiff(id: string) {
		const cur = [...app.ui.diffIds];
		if (cur.includes(id)) return;
		if (cur.length >= 2) cur.shift();
		cur.push(id);
		app.setDiffIds(cur);
	}
</script>

<aside class="manager" data-testid="yggnet-manager">
	<header class="manager__header">
		<p class="brand">Yggnet</p>
		<input
			class="title-input"
			data-testid="doc-title"
			aria-label="Document title"
			value={app.document.title}
			oninput={(e) => {
				const title = (e.currentTarget as HTMLInputElement).value;
				const next = { ...app.document, title, updatedAt: new Date().toISOString() };
				app.document = next;
			}}
		/>
	</header>

	<nav class="modes" aria-label="App mode" data-testid="mode-tabs">
		{#each modes as m (m.id)}
			<button
				type="button"
				class="mode"
				class:active={app.mode === m.id}
				data-testid={`mode-${m.id}`}
				onclick={() => setMode(m.id)}
			>
				{m.label}
			</button>
		{/each}
	</nav>

	<section class="toolbar" aria-label="History and file">
		<button type="button" data-testid="undo" disabled={!app.canUndo} onclick={() => app.undo()}
			>Undo</button
		>
		<button type="button" data-testid="redo" disabled={!app.canRedo} onclick={() => app.redo()}
			>Redo</button
		>
		<button type="button" data-testid="save" onclick={() => app.saveToSlot()}>Save</button>
		<button type="button" data-testid="load" onclick={() => app.loadFromSlot()}>Load</button>
		<button type="button" data-testid="export" onclick={() => app.downloadExport()}>Export</button>
		<label class="file-btn">
			Import
			<input type="file" accept="application/json,.json" data-testid="import" onchange={onImportFile} />
		</label>
		<button type="button" data-testid="palette-trigger" onclick={() => app.openPalette(true)}
			>Palette</button
		>
	</section>

	<section class="block" data-testid="templates">
		<h2>Templates</h2>
		<div class="row wrap">
			<button type="button" data-testid="tpl-blank" onclick={() => app.loadTemplate('blank')}
				>Blank</button
			>
			<button type="button" data-testid="tpl-org" onclick={() => app.loadTemplate('org')}>Org</button>
			<button type="button" data-testid="tpl-roadmap" onclick={() => app.loadTemplate('roadmap')}
				>Roadmap</button
			>
			<button type="button" data-testid="tpl-learning" onclick={() => app.loadTemplate('learning')}
				>Learning</button
			>
		</div>
		<div class="row">
			<input
				type="number"
				min="2"
				max="40"
				bind:value={randomN}
				aria-label="Random node count"
				data-testid="random-n"
			/>
			<button type="button" data-testid="random-graph" onclick={() => app.randomGraph(randomN)}
				>Random</button
			>
		</div>
	</section>

	<section class="block" data-testid="nodes-section">
		<div class="row between">
			<h2>Nodes ({nodes.length})</h2>
			<button type="button" data-testid="add-node" onclick={onAddNode}>Add node</button>
		</div>
		{#if selectedCount > 0}
			<p class="hint" data-testid="selection-count">{selectedCount} selected (Ctrl/Shift-click to multi)</p>
		{/if}
		<ul class="list" data-testid="node-list">
			{#each nodes as node (node.id)}
				<li>
					<button
						type="button"
						class="list-item"
						class:selected={selectedIds.has(node.id)}
						data-testid={`node-item-${node.id}`}
						onclick={(e) => onSelectNode(node.id, e)}
					>
						<span>{node.label}</span>
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
				<button type="button" data-testid="clear-selection" onclick={() => app.clearAllSelection()}
					>Clear selection</button
				>
			</div>
		{/if}
	</section>

	{#if selectedNode}
		<section class="block" data-testid="node-editor">
			<h2>Edit node</h2>
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
			<label>
				Tags (comma)
				<input
					data-testid="node-tags"
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
			<div class="row wrap">
				<button type="button" data-testid="delete-node" onclick={() => app.removeNode(selectedNode.id)}
					>Delete</button
				>
				<button type="button" data-testid="group-selected" onclick={() => app.groupSelected()}
					>Group</button
				>
				<button type="button" data-testid="diff-add" onclick={() => pushDiff(selectedNode.id)}
					>Add to diff</button
				>
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

	{#if groupIds.length}
		<section class="block" data-testid="groups-section">
			<h2>Groups</h2>
			{#each groupIds as gid (gid)}
				<div class="row">
					<span class="muted">{gid.slice(0, 8)}…</span>
					<button type="button" onclick={() => app.toggleCollapseGroup(gid)}
						>{app.groupsCollapsed.has(gid) ? 'Expand' : 'Collapse'}</button
					>
					<button type="button" onclick={() => app.ungroup(gid)}>Ungroup</button>
				</div>
			{/each}
		</section>
	{/if}

	{#if app.mode === 'directions' || app.mode === 'explore'}
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

	{#if app.mode === 'analyze'}
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
			<p class="hint">{app.algorithms.find((a) => a.id === app.analyze.algorithmId)?.description}</p>
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
					<label>
						Step {app.analyze.stepIndex}/{Math.max(0, traceLen - 1)}
						<input
							type="range"
							min="0"
							max={Math.max(0, traceLen - 1)}
							data-testid="step-scrubber"
							value={app.analyze.stepIndex}
							oninput={(e) => app.setStepIndex(Number(e.currentTarget.value))}
						/>
					</label>
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
			{#if Object.keys(app.runStore.runs).length}
				<details>
					<summary>Runs</summary>
					<ul class="list">
						{#each Object.values(app.runStore.runs) as run (run.id)}
							<li class="muted">
								{run.algorithmId} {run.stale ? 'stale' : 'ok'}
								<button type="button" onclick={() => app.setCompareRunIds([run.id, app.analyze.compareRunIds[1] ?? run.id])}
									>A</button
								>
								<button type="button" onclick={() => app.setCompareRunIds([app.analyze.compareRunIds[0] ?? run.id, run.id])}
									>B</button
								>
							</li>
						{/each}
					</ul>
				</details>
			{/if}
		</section>
	{/if}

	{#if diffA && diffB}
		<section class="block" data-testid="diff-panel">
			<h2>Diff</h2>
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
					app.setMode('directions');
				}}>Path between</button
			>
			<button type="button" onclick={() => app.setDiffIds([])}>Clear</button>
		</section>
	{/if}

	{#if app.statusMessage}
		<p class="status" data-testid="status-message">{app.statusMessage}</p>
	{/if}
</aside>

<style>
	.manager {
		display: flex;
		flex-direction: column;
		gap: 0.85rem;
		padding: 1rem 0.85rem;
		background: var(--yg-panel);
		border-right: 1px solid var(--yg-border);
		width: min(22rem, 38vw);
		min-width: 16rem;
		overflow: auto;
		max-height: 100dvh;
	}

	.brand {
		margin: 0;
		font-size: 1.2rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--yg-fg);
	}

	.title-input {
		width: 100%;
		margin-top: 0.35rem;
		border: 1px solid var(--yg-border);
		border-radius: 6px;
		padding: 0.35rem 0.5rem;
		background: #fff;
		color: var(--yg-fg);
		font: inherit;
	}

	.modes {
		display: flex;
		gap: 0.25rem;
	}

	.mode,
	button,
	.file-btn {
		font: inherit;
		font-size: 0.8rem;
		border: 1px solid var(--yg-border);
		background: #fff;
		color: var(--yg-fg);
		border-radius: 6px;
		padding: 0.35rem 0.5rem;
		cursor: pointer;
	}

	.mode.active,
	button.active {
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
		border-color: color-mix(in srgb, var(--yg-accent) 35%, var(--yg-border));
	}

	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
	}

	.file-btn {
		display: inline-flex;
		align-items: center;
		position: relative;
		overflow: hidden;
	}

	.file-btn input {
		position: absolute;
		inset: 0;
		opacity: 0;
		cursor: pointer;
	}

	.block h2 {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--yg-muted);
		font-weight: 600;
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
		max-height: 10rem;
		overflow: auto;
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
		border-radius: 6px;
		padding: 0.3rem 0.45rem;
		background: #fff;
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

	.status {
		margin: 0;
		font-size: 0.8rem;
		color: var(--yg-accent);
	}

	.diff {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		font-size: 0.85rem;
	}
</style>
