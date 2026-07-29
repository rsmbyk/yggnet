<script lang="ts">
	import { onMount } from 'svelte';
	import ManagerPanel from '$lib/ui/ManagerPanel.svelte';
	import { createSession } from '$lib/session';

	const session = createSession('Untitled graph');

	let WorldCanvas: typeof import('$lib/world/WorldCanvas.svelte').default | null = $state(null);

	onMount(() => {
		let cancelled = false;
		import('$lib/world/WorldCanvas.svelte').then((m) => {
			if (!cancelled) WorldCanvas = m.default;
		});
		return () => {
			cancelled = true;
		};
	});
</script>

<div id="yggnet-app" class="shell" data-testid="yggnet-shell">
	<ManagerPanel mode={session.mode} title={session.document.title} />
	<main class="viewport">
		{#if WorldCanvas}
			<WorldCanvas />
		{:else}
			<div class="world-placeholder" data-testid="yggnet-world-placeholder">Loading world…</div>
		{/if}
	</main>
</div>

<style>
	.shell {
		display: grid;
		grid-template-columns: auto 1fr;
		height: 100dvh;
		min-height: 100vh;
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
</style>
