<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import ManagerPanel from '$lib/ui/ManagerPanel.svelte';
	import Toolbar from '$lib/ui/Toolbar.svelte';
	import { app } from '$lib/session/app.svelte';
	import { applyBeforeUnloadGuard } from '$lib/session/work-busy';
	import { tabTitleFromGraph } from '$lib/session/tab-title';
	import { edgesCompanionOpen, nodesCompanionOpen, selectionPanelOpen } from '$lib/ui/tool-ids';
	import { forwardWheelEvent, worldCanvas } from '$lib/ui/forward-wheel';

	const slide = { duration: 220, x: -28, opacity: 0 };
	let WorldCanvas: typeof import('$lib/world/WorldCanvas.svelte').default | null = $state(null);

	onMount(() => {
		let cancelled = false;
		window.__YGGNET_RELAYOUT = () => app.relayout();
		window.__YGGNET_PIN_NODE = (id: string, pinned = true) => app.pinNode(id, pinned);
		app.beginWork('load');
		import('$lib/world/WorldCanvas.svelte')
			.then(async (m) => {
				if (cancelled) return;
				WorldCanvas = m.default;
				await tick();
				if (cancelled) return;
				app.initFromAutosave();
				await app.waitForSceneReady(app.document.id, app.workSignal);
				app.frameOpenGraph();
				if (!cancelled && app.busyKind === 'load') app.finishWork();
			})
			.catch(() => {
				if (!cancelled) app.finishWork();
			});
		return () => {
			cancelled = true;
			delete window.__YGGNET_RELAYOUT;
			delete window.__YGGNET_PIN_NODE;
			if (app.busyKind === 'load') app.finishWork();
		};
	});

	function onKeydown(e: KeyboardEvent) {
		if (app.busyKind) {
			e.preventDefault();
			return;
		}
		const target = e.target as HTMLElement | null;
		const typing =
			target &&
			(target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
		const meta = e.ctrlKey || e.metaKey;
		if (meta && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			app.openPalette(!app.ui.paletteOpen);
			return;
		}
		if (e.key === 'Escape') {
			if (app.ui.paletteOpen) {
				app.openPalette(false);
				return;
			}
			if (app.ui.connectFromId) {
				app.setConnectFrom(null);
				return;
			}
			if (app.ui.openTool) {
				app.setOpenTool(null);
				return;
			}
			app.clearAllSelection();
			return;
		}
		if (typing) return;
		if (e.key === 'm' || e.key === 'M') {
			e.preventDefault();
			app.toggleManager();
			return;
		}
		if (e.key === 'Delete' || e.key === 'Backspace') {
			e.preventDefault();
			app.deleteSelection();
		}
	}

	const paletteFindResults = $derived.by(() => {
		const q = app.ui.commandQuery.trim();
		if (!q) return [];
		return app.findNodesByQuery(q).map((id) => {
			const node = app.document.nodes[id];
			return {
				id,
				label: node?.label ?? id
			};
		});
	});

	function jumpToFindResult(nodeId: string) {
		app.jumpToNode(nodeId);
		app.openPalette(false);
	}

	function closePalette() {
		app.openPalette(false);
	}

	function onPaletteBackdropClick(e: MouseEvent) {
		if (e.target === e.currentTarget) closePalette();
	}

	function onScrimWheel(e: WheelEvent) {
		const canvas = worldCanvas(document);
		if (!canvas) return;
		forwardWheelEvent(e, canvas);
	}

	const showSelectionPanel = $derived(
		selectionPanelOpen(app.ui.openTool, app.selection.nodeIds.length, app.selection.edgeIds.length)
	);
	const showNodesCompanion = $derived(
		nodesCompanionOpen(app.ui.openTool, app.selection.nodeIds.length)
	);
	const showEdgesCompanion = $derived(
		edgesCompanionOpen(app.ui.openTool, app.selection.edgeIds.length)
	);
	const showSelectionSlot = $derived(
		showSelectionPanel || showNodesCompanion || showEdgesCompanion
	);

	const tabTitle = $derived(tabTitleFromGraph(app.document.title));

	function onBeforeUnload(e: BeforeUnloadEvent) {
		applyBeforeUnloadGuard(app.busyKind !== null, e);
	}
</script>

<svelte:head>
	<title>{tabTitle}</title>
</svelte:head>

<svelte:window onkeydown={onKeydown} onbeforeunload={onBeforeUnload} />

<div id="yggnet-app" class="shell" data-testid="yggnet-shell">
	<main class="viewport">
		{#if WorldCanvas}
			<WorldCanvas />
		{:else}
			<div class="world-placeholder" data-testid="yggnet-world-placeholder">Loading world…</div>
		{/if}

		{#if app.ui.paletteOpen}
			<div
				class="palette-backdrop"
				data-testid="command-palette"
				role="presentation"
				transition:fade={{ duration: 160 }}
				onclick={onPaletteBackdropClick}
			>
				<div
					class="palette"
					role="dialog"
					aria-modal="true"
					aria-label="Command palette"
					transition:fly={{ y: -10, duration: 200, opacity: 0 }}
					onclick={(e) => e.stopPropagation()}
				>
					<input
						data-testid="palette-input"
						placeholder="Find a node…"
						value={app.ui.commandQuery}
						oninput={(e) => app.setCommandQuery(e.currentTarget.value)}
					/>
					{#if paletteFindResults.length > 0}
						<ul data-testid="palette-find-results">
							{#each paletteFindResults as hit (hit.id)}
								<li>
									<button
										type="button"
										data-testid={`palette-find-${hit.id}`}
										onclick={() => jumpToFindResult(hit.id)}
									>
										{hit.label}
									</button>
								</li>
							{/each}
						</ul>
					{:else if app.ui.commandQuery.trim()}
						<p class="hint">No nodes match</p>
					{/if}
					<p class="hint">Ctrl+K · Esc to close</p>
				</div>
			</div>
		{/if}
	</main>

	{#if app.ui.openTool}
		<button
			type="button"
			class="drawer-scrim"
			aria-label="Close tools panel"
			data-testid="manager-scrim"
			transition:fade={{ duration: 180 }}
			onclick={() => app.setOpenTool(null)}
			onwheel={onScrimWheel}
		></button>
	{/if}
	<div class="tool-dock">
		<Toolbar />
		<div
			class="tool-panel-stage"
			class:fill={app.ui.openTool !== null}
			class:companion={showNodesCompanion || showEdgesCompanion}
		>
			{#if app.ui.openTool}
				<div class="tool-panel-slot" transition:fly={slide}>
					<ManagerPanel section={app.ui.openTool} />
				</div>
			{/if}
			{#if showSelectionSlot}
				<div class="tool-panel-slot">
					<ManagerPanel section="selection" />
				</div>
			{/if}
		</div>
	</div>

	{#if app.busyKind || !WorldCanvas}
		{@const kind = app.busyKind ?? 'load'}
		<div
			class="work-overlay"
			data-testid="work-overlay"
			role="alertdialog"
			aria-modal="true"
			tabindex="-1"
			aria-labelledby="work-overlay-title"
		>
			<div class="work-overlay-card">
				<p id="work-overlay-title">
					{kind === 'generate' ? 'Generating graph…' : 'Loading graph…'}
				</p>
			</div>
		</div>
	{/if}
</div>

<style>
	.shell {
		position: relative;
		height: 100dvh;
		min-height: 100vh;
		background: var(--yg-bg);
		overflow: hidden;
	}

	.viewport {
		width: 100%;
		height: 100%;
		min-width: 0;
		min-height: 0;
		position: relative;
	}

	.drawer-scrim {
		position: absolute;
		inset: 0;
		z-index: 15;
		border: none;
		padding: 0;
		margin: 0;
		background: rgba(28, 36, 46, 0.28);
		cursor: pointer;
	}

	.tool-dock {
		position: absolute;
		top: calc(var(--yg-top-bar-h) + (2 * var(--yg-hud-edge)));
		left: var(--yg-hud-edge);
		bottom: var(--yg-hud-edge);
		z-index: 16;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		justify-content: flex-start;
		gap: var(--yg-hud-edge);
		max-width: calc(100% - 1.5rem);
		pointer-events: none;
	}

	.tool-panel-stage {
		position: relative;
		display: flex;
		flex-direction: row;
		align-items: flex-start;
		gap: var(--yg-hud-edge);
		min-width: 0;
		max-height: 100%;
		pointer-events: none;
	}

	.tool-panel-stage.fill {
		align-self: flex-start;
		max-height: 100%;
		min-height: 0;
	}

	.tool-panel-slot {
		display: flex;
		align-items: flex-start;
		min-width: 0;
		min-height: 0;
		height: auto;
		max-height: 100%;
		pointer-events: auto;
	}

	.tool-dock :global(.toolbar) {
		align-self: flex-start;
		pointer-events: auto;
	}

	.tool-dock :global(.manager) {
		pointer-events: auto;
		cursor: default;
	}

	.tool-dock :global(.manager--fill) {
		flex: 0 1 auto;
		min-height: 0;
	}

	.world-placeholder {
		display: grid;
		place-items: center;
		height: 100%;
		color: var(--yg-muted);
		background: var(--yg-world-bg);
	}

	.palette-backdrop {
		position: absolute;
		inset: 0;
		background: rgba(28, 36, 46, 0.32);
		display: grid;
		place-items: start center;
		padding-top: 12vh;
		z-index: 20;
		cursor: pointer;
	}

	.palette {
		width: min(28rem, 92vw);
		background: var(--yg-panel-glass-strong);
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-modal);
		padding: var(--yg-pad-modal);
		box-shadow: 0 10px 28px rgba(28, 36, 46, 0.16);
		cursor: default;
	}

	.palette input {
		width: 100%;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--yg-border);
		border-radius: var(--yg-radius-control);
		background: var(--yg-chip);
		color: var(--yg-fg);
	}

	.palette ul {
		list-style: none;
		margin: 0.55rem 0 0;
		padding: 0;
		max-height: 16rem;
		overflow: auto;
	}

	.palette li button {
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.5rem 0.6rem;
		border: none;
		background: transparent;
		border-radius: var(--yg-radius-control);
		cursor: pointer;
		color: var(--yg-fg);
		transition: background var(--yg-motion-fast) var(--yg-ease);
	}

	.palette li button:hover {
		background: var(--yg-accent-soft);
	}

	.hint {
		margin: 0.5rem 0 0;
		font-size: 0.9rem;
		color: var(--yg-muted);
	}

	.work-overlay {
		position: fixed;
		inset: 0;
		z-index: 1000;
		display: grid;
		place-items: center;
		background: rgba(28, 36, 46, 0.72);
		pointer-events: auto;
		cursor: default;
	}

	.work-overlay-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.85rem;
		padding: 1.15rem 1.4rem;
		border-radius: var(--yg-radius-modal);
		background: var(--yg-panel-glass-strong);
		border: 1px solid var(--yg-border);
		box-shadow: 0 10px 28px rgba(28, 36, 46, 0.2);
		pointer-events: auto;
	}

	.work-overlay-card p {
		margin: 0;
		font-size: 0.95rem;
		font-weight: 650;
		color: var(--yg-fg);
	}
</style>
