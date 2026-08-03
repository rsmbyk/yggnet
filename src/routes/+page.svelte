<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly } from 'svelte/transition';
	import ManagerPanel from '$lib/ui/ManagerPanel.svelte';
	import { app } from '$lib/session/app.svelte';

	const slide = { duration: 220, x: 28, opacity: 0 };
	let WorldCanvas: typeof import('$lib/world/WorldCanvas.svelte').default | null = $state(null);

	onMount(() => {
		app.initFromAutosave();
		let cancelled = false;
		import('$lib/world/WorldCanvas.svelte').then((m) => {
			if (!cancelled) WorldCanvas = m.default;
		});
		return () => {
			cancelled = true;
		};
	});

	function onKeydown(e: KeyboardEvent) {
		const target = e.target as HTMLElement | null;
		const typing =
			target &&
			(target.tagName === 'INPUT' ||
				target.tagName === 'TEXTAREA' ||
				target.isContentEditable);
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
			if (app.ui.managerOpen) {
				app.setManagerOpen(false);
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
</script>

<svelte:window onkeydown={onKeydown} />

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

	{#if app.ui.managerOpen}
		<button
			type="button"
			class="drawer-scrim"
			aria-label="Close advanced panel"
			data-testid="manager-scrim"
			transition:fade={{ duration: 180 }}
			onclick={() => app.setManagerOpen(false)}
		></button>
		<div class="drawer-slot" transition:fly={slide}>
			<ManagerPanel />
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
		background: rgba(28, 36, 46, 0.12);
		cursor: pointer;
	}

	.drawer-slot {
		position: absolute;
		top: 0.75rem;
		right: 0.75rem;
		bottom: 0.75rem;
		z-index: 16;
		display: flex;
		max-width: calc(100% - 1.5rem);
		pointer-events: none;
	}

	.drawer-slot :global(.manager) {
		pointer-events: auto;
		cursor: default;
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
</style>
