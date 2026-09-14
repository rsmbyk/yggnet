<script lang="ts">
	import { fade } from 'svelte/transition';
	import { app } from '$lib/session/app.svelte';
	import { worldTune } from '$lib/world/world-tune.svelte';
	import WorldTunePanel from './WorldTunePanel.svelte';

	const selectedId = $derived(app.selection.nodeIds[0] ?? null);
	const selectedCount = $derived(app.selection.nodeIds.length);
	const selectedNode = $derived(selectedId ? app.document.nodes[selectedId] : null);
	const selectedEdgeId = $derived(app.selection.edgeIds[0] ?? null);
	const selectedEdge = $derived(selectedEdgeId ? app.document.edges[selectedEdgeId] : null);
	const connecting = $derived(app.ui.connectFromId !== null);
	/** One sheet shell for node / multi / edge — avoids outro jumps when switching modes. */
	const sheetOpen = $derived(
		(selectedCount === 1 && selectedNode != null) || selectedCount > 1 || selectedEdge != null
	);
	const sheetTestId = $derived(
		selectedCount > 1
			? 'world-multi-sheet'
			: selectedCount === 1
				? 'world-node-sheet'
				: 'world-edge-sheet'
	);

	/** Brief toast: clear after a short dwell when the message is still the same. */
	$effect(() => {
		const msg = app.statusMessage;
		if (!msg) return;
		const handle = setTimeout(() => {
			if (app.statusMessage === msg) app.statusMessage = '';
		}, 2400);
		return () => clearTimeout(handle);
	});

	function addNearView() {
		const t = app.camera.target;
		const n = Object.keys(app.document.nodes).length;
		const jitter = (n % 5) * 0.4;
		app.addNodeAt({ x: t.x + jitter, y: worldTune.values.defaultNodeY, z: t.z + jitter });
	}

	function startConnect() {
		if (!selectedId) return;
		app.setConnectFrom(selectedId);
	}

	function cancelConnect() {
		app.setConnectFrom(null);
	}

	const sheetFade = { duration: 160 };
	const toastFade = { duration: 220 };
</script>

<div class="hud" data-testid="world-hud">
	<div class="top-row">
		<header class="chrome">
			<!-- Brand: swap static/brand/logo.svg (see static/brand/README.md) -->
			<img
				class="logo"
				src="/brand/logo.svg"
				alt="Yggnet"
				width="32"
				height="32"
				data-testid="brand-logo"
			/>

			<div class="tools">
				<button
					type="button"
					class="icon-btn"
					data-testid="undo"
					aria-label="Undo"
					title="Undo"
					disabled={!app.canUndo}
					onclick={() => app.undo()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill="currentColor"
							d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"
						/>
					</svg>
				</button>
				<button
					type="button"
					class="icon-btn"
					data-testid="redo"
					aria-label="Redo"
					title="Redo"
					disabled={!app.canRedo}
					onclick={() => app.redo()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true">
						<path
							fill="currentColor"
							d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"
						/>
					</svg>
				</button>
				<button
					type="button"
					class="icon-btn"
					data-testid="world-add-node"
					aria-label="Add node"
					title="Add node"
					onclick={addNearView}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path fill="currentColor" d="M19 11h-6V5h-2v6H5v2h6v6h2v-6h6z" /></svg
					>
				</button>
				<button
					type="button"
					class="icon-btn"
					data-testid="palette-trigger"
					aria-label="Command palette"
					title="Palette (Ctrl+K)"
					onclick={() => app.openPalette(true)}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path
							fill="currentColor"
							d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"
						/></svg
					>
				</button>
				<button
					type="button"
					class="icon-btn"
					data-testid="world-tune-toggle"
					aria-label="World tune"
					title="World tune (live sizes)"
					class:active={worldTune.open}
					onclick={() => worldTune.toggle()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path
							fill="currentColor"
							d="M7 3v6H5v2h2v10h2V11h2V9H9V3H7zm8 0v10h-2v2h2v6h2v-6h2v-2h-2V3h-2z"
						/></svg
					>
				</button>
				<button
					type="button"
					class="icon-btn advanced"
					data-testid="open-manager"
					aria-label="Advanced panel"
					title="Advanced (M)"
					class:active={app.ui.managerOpen}
					onclick={() => app.toggleManager()}
				>
					<svg viewBox="0 0 24 24" aria-hidden="true"
						><path
							fill="currentColor"
							d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"
						/></svg
					>
				</button>
			</div>
		</header>

		<WorldTunePanel />

		{#if connecting}
			<div class="banner-slot" transition:fade={{ duration: 160 }}>
				<p class="banner" data-testid="connect-banner">
					<span class="banner-text">
						{#if app.ui.connectDirectedLocked}
							Connecting (directed) — click another node · RMB / Esc cancel
						{:else if app.ui.connectDirected}
							Connecting (directed) — release Alt for undirected
						{:else}
							Connecting — click another node · hold Alt for directed
						{/if}
					</span>
					<button type="button" onclick={cancelConnect}>Cancel</button>
				</p>
			</div>
		{/if}
	</div>

	{#if sheetOpen}
		<div class="sheet-slot">
			<section class="sheet" data-testid={sheetTestId} transition:fade={sheetFade}>
				{#if selectedNode && selectedCount === 1}
					<label>
						Label
						<input
							data-testid="world-node-label"
							value={selectedNode.label}
							oninput={(e) => app.updateNode(selectedNode.id, { label: e.currentTarget.value })}
						/>
					</label>
					<div class="sheet-actions">
						<button
							type="button"
							data-testid="world-connect"
							class:active={app.ui.connectFromId === selectedNode.id}
							onclick={startConnect}>Connect</button
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
					<p class="sheet-title">{selectedCount} nodes selected</p>
					<div class="sheet-actions">
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
					<p class="sheet-title">
						{app.document.nodes[selectedEdge.from]?.label ?? '?'}
						{selectedEdge.directed ? '→' : '—'}
						{app.document.nodes[selectedEdge.to]?.label ?? '?'}
					</p>
					<div class="sheet-actions">
						<button
							type="button"
							data-testid="world-toggle-directed"
							onclick={() =>
								app.updateEdge(selectedEdge.id, { directed: !selectedEdge.directed })}
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
		</div>
	{/if}

	<div class="toast-slot">
		{#if app.statusMessage}
			<p
				class="toast"
				data-testid="status-message"
				in:fade={toastFade}
				out:fade={{ duration: 180 }}
			>
				{app.statusMessage}
			</p>
		{/if}
	</div>
</div>

<style>
	.hud {
		pointer-events: none;
		position: absolute;
		inset: 0;
		z-index: 5;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		padding: 0.75rem 1rem;
		gap: 0.5rem;
	}

	.chrome,
	.sheet,
	.banner,
	.toast,
	.chrome button,
	.sheet button,
	.banner button {
		pointer-events: auto;
	}

	/* Shared top band: chrome left, connect banner dead-center — same Y + same height. */
	.top-row {
		/* icon-btn 2.05rem + chrome vertical padding 0.35rem×2 */
		--yg-top-bar-h: calc(2.05rem + 0.7rem);
		position: relative;
		display: flex;
		align-items: center;
		width: 100%;
		height: var(--yg-top-bar-h);
		pointer-events: none;
	}

	.chrome {
		position: relative;
		z-index: 2;
		box-sizing: border-box;
		height: var(--yg-top-bar-h);
		width: fit-content;
		max-width: 100%;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
		gap: 0.55rem 0.75rem;
		padding: 0 0.4rem;
		border-radius: var(--yg-radius-pill);
		background: var(--yg-panel-glass-dim);
		border: 1px solid rgba(28, 36, 46, 0.1);
		box-shadow: 0 4px 16px rgba(28, 36, 46, 0.04);
		pointer-events: auto;
		transition:
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease),
			box-shadow var(--yg-motion) var(--yg-ease);
	}

	.chrome:hover,
	.chrome:focus-within {
		background: var(--yg-panel-glass);
		border-color: var(--yg-border);
		box-shadow: 0 6px 20px rgba(28, 36, 46, 0.12);
	}

	.logo {
		display: block;
		width: 2rem;
		height: 2rem;
		border-radius: var(--yg-radius-pill);
		flex-shrink: 0;
		object-fit: contain;
		opacity: var(--yg-hud-idle-opacity);
		transition: opacity var(--yg-motion) var(--yg-ease);
	}

	.chrome:hover .logo,
	.chrome:focus-within .logo {
		opacity: var(--yg-hud-active-opacity);
	}

	.tools,
	.sheet-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		align-items: center;
	}

	.icon-btn {
		display: inline-grid;
		place-items: center;
		width: 2.05rem;
		height: 2.05rem;
		padding: 0;
		border: 1px solid rgba(28, 36, 46, 0.1);
		background: var(--yg-chip-dim);
		color: var(--yg-fg);
		border-radius: var(--yg-radius-pill);
		cursor: pointer;
		opacity: var(--yg-hud-idle-opacity);
		transition:
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease),
			color var(--yg-motion) var(--yg-ease),
			opacity var(--yg-motion) var(--yg-ease);
	}

	.chrome:hover .icon-btn,
	.chrome:focus-within .icon-btn {
		opacity: var(--yg-hud-active-opacity);
		background: var(--yg-chip);
		border-color: var(--yg-border);
	}

	.icon-btn svg {
		width: 1.05rem;
		height: 1.05rem;
		display: block;
	}

	.chrome:hover .icon-btn:hover,
	.chrome:focus-within .icon-btn:hover {
		background: rgba(255, 255, 255, 0.72);
	}

	.sheet button,
	.banner button {
		font: inherit;
		font-size: 0.78rem;
		border: 1px solid var(--yg-border);
		background: var(--yg-chip);
		color: var(--yg-fg);
		border-radius: var(--yg-radius-control);
		padding: 0.32rem 0.65rem;
		cursor: pointer;
		text-shadow: var(--yg-text-glow);
		transition:
			background var(--yg-motion-fast) var(--yg-ease),
			border-color var(--yg-motion-fast) var(--yg-ease),
			color var(--yg-motion-fast) var(--yg-ease);
	}

	.sheet button:hover,
	.banner button:hover {
		background: rgba(255, 255, 255, 0.72);
	}

	.icon-btn.active,
	button.active {
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
		border-color: color-mix(in srgb, var(--yg-accent) 40%, var(--yg-border));
	}

	.icon-btn.advanced {
		border-style: dashed;
	}

	button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	button.danger {
		color: #8b3a3a;
		border-color: color-mix(in srgb, #8b3a3a 35%, var(--yg-border));
	}

	/* Same top + same height as .chrome; horizontally page-centered; width = content. */
	.banner-slot {
		position: absolute;
		left: 50%;
		top: 0;
		transform: translateX(-50%);
		z-index: 1;
		height: var(--yg-top-bar-h);
		width: max-content;
		max-width: min(100%, calc(100vw - 2rem));
		pointer-events: none;
	}

	.banner {
		pointer-events: auto;
		box-sizing: border-box;
		height: 100%;
		width: max-content;
		max-width: 100%;
		margin: 0;
		/* Match chrome edge inset; a bit more on the text side so copy isn’t tight to the curve */
		padding: 0.25rem 0.35rem 0.25rem 0.85rem;
		border-radius: var(--yg-radius-pill);
		background: var(--yg-panel-glass);
		border: 1px solid var(--yg-border);
		box-shadow: 0 6px 20px rgba(28, 36, 46, 0.12);
		color: var(--yg-fg);
		font-size: 0.82rem;
		font-weight: 600;
		letter-spacing: 0.01em;
		line-height: 1.2;
		display: inline-flex;
		flex-wrap: nowrap;
		gap: 0.5rem;
		align-items: center;
		white-space: nowrap;
		text-shadow: var(--yg-text-glow);
	}

	.banner-text {
		color: var(--yg-fg);
		padding-block: 0.1rem;
	}

	.banner button {
		font-weight: 600;
		flex-shrink: 0;
		height: 100%;
		padding: 0 0.75rem;
		border-radius: var(--yg-radius-pill);
	}

	/* Only when the viewport is too narrow for chrome + centered banner on one line */
	@media (max-width: 640px) {
		.top-row {
			height: auto;
			flex-wrap: wrap;
			justify-content: center;
			gap: 0.45rem;
		}

		.chrome {
			width: 100%;
			justify-content: flex-start;
		}

		.banner-slot {
			position: static;
			transform: none;
			margin-inline: auto;
			height: var(--yg-top-bar-h);
		}
	}

	/* Centering lives on the sheet itself so Svelte outro (position:absolute) stays put. */
	.sheet-slot {
		pointer-events: none;
		z-index: 5;
	}

	.sheet {
		position: absolute;
		left: 50%;
		bottom: 0.75rem;
		transform: translateX(-50%);
		width: min(18rem, 90vw);
		margin: 0;
		padding: var(--yg-pad-panel);
		border-radius: var(--yg-radius-panel);
		background: var(--yg-panel-glass);
		border: 1px solid var(--yg-border);
		box-shadow: 0 6px 20px rgba(28, 36, 46, 0.1);
		display: flex;
		flex-direction: column;
		gap: 0.65rem;
		pointer-events: auto;
	}

	.sheet,
	.sheet-title,
	.hint {
		text-shadow: var(--yg-text-glow);
	}

	.sheet-title {
		margin: 0;
		font-size: 0.9rem;
		font-weight: 600;
	}

	.sheet label {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		font-size: 0.72rem;
		color: var(--yg-muted);
	}

	.sheet input {
		font: inherit;
		font-size: 0.9rem;
		padding: 0.4rem 0.55rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		color: var(--yg-fg);
	}

	.hint {
		margin: 0;
		font-size: 0.68rem;
		color: var(--yg-muted);
	}

	.toast-slot {
		position: absolute;
		left: 50%;
		bottom: 7.5rem;
		transform: translateX(-50%);
		pointer-events: none;
		z-index: 6;
	}

	.toast {
		margin: 0;
		padding: 0.55rem 1.1rem;
		border-radius: var(--yg-radius-panel);
		background: rgba(28, 36, 46, 0.72);
		border: 1px solid rgba(255, 255, 255, 0.14);
		color: #e8eef4;
		font-size: 0.8rem;
		max-width: min(28rem, 90vw);
		text-align: center;
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
		pointer-events: auto;
	}
</style>
