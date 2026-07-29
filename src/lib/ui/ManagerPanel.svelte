<script lang="ts">
	import type { AppMode } from '$lib/graph';

	interface Props {
		mode: AppMode;
		title: string;
	}

	let { mode, title }: Props = $props();
</script>

<aside class="manager" data-testid="yggnet-manager">
	<header class="manager__header">
		<p class="brand">Yggnet</p>
		<p class="subtitle">{title}</p>
	</header>
	<nav class="modes" aria-label="App mode">
		<span class="mode" class:active={mode === 'explore'}>Explore</span>
		<span class="mode" class:active={mode === 'directions'}>Directions</span>
		<span class="mode" class:active={mode === 'analyze'}>Analyze</span>
	</nav>
	<p class="hint">Manager shell — CRUD and tools land via SPECs.</p>
</aside>

<style>
	.manager {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem 1rem;
		background: var(--yg-panel);
		border-right: 1px solid var(--yg-border);
		min-width: 16rem;
		max-width: 20rem;
	}

	.brand {
		margin: 0;
		font-size: 1.25rem;
		font-weight: 600;
		letter-spacing: 0.02em;
		color: var(--yg-fg);
	}

	.subtitle {
		margin: 0.25rem 0 0;
		font-size: 0.85rem;
		color: var(--yg-muted);
	}

	.modes {
		display: flex;
		flex-direction: column;
		gap: 0.35rem;
	}

	.mode {
		padding: 0.4rem 0.55rem;
		border-radius: 6px;
		color: var(--yg-muted);
		font-size: 0.9rem;
	}

	.mode.active {
		background: var(--yg-accent-soft);
		color: var(--yg-accent);
	}

	.hint {
		margin: auto 0 0;
		font-size: 0.8rem;
		color: var(--yg-muted);
		line-height: 1.4;
	}
</style>
