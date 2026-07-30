<script lang="ts">
	import { onMount } from 'svelte';
	import ManagerPanel from '$lib/ui/ManagerPanel.svelte';
	import { app } from '$lib/session/app.svelte';

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
		const meta = e.ctrlKey || e.metaKey;
		if (meta && e.key.toLowerCase() === 'k') {
			e.preventDefault();
			app.openPalette(!app.ui.paletteOpen);
			return;
		}
		if (e.key === 'Escape' && app.ui.paletteOpen) {
			app.openPalette(false);
		}
	}

	const paletteCommands = $derived.by(() => {
		const q = app.ui.commandQuery.trim().toLowerCase();
		const items: { id: string; label: string; run: () => void }[] = [
			{ id: 'mode-explore', label: 'Switch to Explore', run: () => app.setMode('explore') },
			{ id: 'mode-directions', label: 'Switch to Directions', run: () => app.setMode('directions') },
			{ id: 'mode-analyze', label: 'Switch to Analyze', run: () => app.setMode('analyze') },
			{
				id: 'run-bfs',
				label: 'Run BFS',
				run: () => {
					app.setAlgorithm('bfs');
					void app.runAlgorithm();
				}
			},
			{ id: 'add-node', label: 'Add node', run: () => app.addNode() },
			{ id: 'undo', label: 'Undo', run: () => app.undo() },
			{ id: 'redo', label: 'Redo', run: () => app.redo() }
		];
		if (!q) return items;
		return items.filter((i) => i.label.toLowerCase().includes(q));
	});

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

	function runItem(item: { run: () => void }) {
		item.run();
		app.openPalette(false);
	}

	function jumpToFindResult(nodeId: string) {
		app.jumpToNode(nodeId);
		app.openPalette(false);
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div id="yggnet-app" class="shell" data-testid="yggnet-shell">
	<ManagerPanel />
	<main class="viewport">
		{#if WorldCanvas}
			<WorldCanvas />
		{:else}
			<div class="world-placeholder" data-testid="yggnet-world-placeholder">Loading world…</div>
		{/if}

		{#if app.ui.paletteOpen}
			<div class="palette-backdrop" data-testid="command-palette" role="presentation">
				<div
					class="palette"
					role="dialog"
					aria-modal="true"
					aria-label="Command palette"
				>
					<input
						data-testid="palette-input"
						placeholder="Find node, switch mode, run bfs…"
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
					{/if}
					<ul>
						{#each paletteCommands as item (item.id)}
							<li>
								<button type="button" data-testid={`palette-item-${item.id}`} onclick={() => runItem(item)}>
									{item.label}
								</button>
							</li>
						{/each}
					</ul>
					<p class="hint">Ctrl+K · Esc to close</p>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: auto 1fr;
		height: 100dvh;
		min-height: 100vh;
		background: var(--yg-bg);
	}

	.viewport {
		min-width: 0;
		min-height: 0;
		position: relative;
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
		background: color-mix(in srgb, #1c242e 45%, transparent);
		display: grid;
		place-items: start center;
		padding-top: 12vh;
		z-index: 20;
	}

	.palette {
		width: min(28rem, 92vw);
		background: var(--yg-panel);
		border: 1px solid var(--yg-border);
		border-radius: 10px;
		padding: 0.75rem;
		box-shadow: 0 12px 40px color-mix(in srgb, #1c242e 25%, transparent);
	}

	.palette input {
		width: 100%;
		font: inherit;
		font-size: 1rem;
		padding: 0.55rem 0.65rem;
		border: 1px solid var(--yg-border);
		border-radius: 8px;
		background: #fff;
		color: var(--yg-fg);
	}

	.palette ul {
		list-style: none;
		margin: 0.5rem 0 0;
		padding: 0;
		max-height: 16rem;
		overflow: auto;
	}

	.palette li button {
		width: 100%;
		text-align: left;
		font: inherit;
		font-size: 0.9rem;
		padding: 0.45rem 0.55rem;
		border: none;
		background: transparent;
		border-radius: 6px;
		cursor: pointer;
		color: var(--yg-fg);
	}

	.palette li button:hover {
		background: var(--yg-accent-soft);
	}

	.hint {
		margin: 0.5rem 0 0;
		font-size: 0.75rem;
		color: var(--yg-muted);
	}
</style>
