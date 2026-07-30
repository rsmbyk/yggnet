<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { app } from '$lib/session/app.svelte';
	import GraphScene from './GraphScene.svelte';

	const minimapNodes = $derived(
		Object.values(app.document.nodes).map((n) => ({
			id: n.id,
			x: n.position.x,
			z: n.position.z,
			selected: app.selection.nodeIds[0] === n.id
		}))
	);

	const minimapBounds = $derived.by(() => {
		if (minimapNodes.length === 0) return { minX: -10, maxX: 10, minZ: -10, maxZ: 10 };
		let minX = Infinity;
		let maxX = -Infinity;
		let minZ = Infinity;
		let maxZ = -Infinity;
		for (const n of minimapNodes) {
			minX = Math.min(minX, n.x);
			maxX = Math.max(maxX, n.x);
			minZ = Math.min(minZ, n.z);
			maxZ = Math.max(maxZ, n.z);
		}
		const pad = 2;
		return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
	});

	function projectMinimap(x: number, z: number) {
		const { minX, maxX, minZ, maxZ } = minimapBounds;
		const w = maxX - minX || 1;
		const h = maxZ - minZ || 1;
		return {
			cx: ((x - minX) / w) * 100,
			cy: ((z - minZ) / h) * 100
		};
	}

	function panToNormalized(u: number, v: number) {
		const { minX, maxX, minZ, maxZ } = minimapBounds;
		app.setCamera({
			target: {
				x: minX + u * (maxX - minX),
				y: 0,
				z: minZ + v * (maxZ - minZ)
			},
			distance: app.camera.distance
		});
	}

	function onMinimapClick(ev: MouseEvent) {
		const svg = ev.currentTarget as SVGSVGElement;
		const rect = svg.getBoundingClientRect();
		panToNormalized((ev.clientX - rect.left) / rect.width, (ev.clientY - rect.top) / rect.height);
	}

	function onMinimapKey(ev: KeyboardEvent) {
		if (ev.key === 'Enter' || ev.key === ' ') {
			ev.preventDefault();
			panToNormalized(0.5, 0.5);
		}
	}

	const cam = $derived(projectMinimap(app.camera.target.x, app.camera.target.z));
</script>

<div class="world" data-testid="yggnet-world">
	<Canvas>
		<GraphScene />
	</Canvas>

	<svg
		class="minimap"
		data-testid="yggnet-minimap"
		viewBox="0 0 100 100"
		role="button"
		tabindex="0"
		aria-label="Minimap"
		onclick={onMinimapClick}
		onkeydown={onMinimapKey}
	>
		<rect x="0" y="0" width="100" height="100" class="minimap-bg" />
		{#each minimapNodes as n (n.id)}
			{@const p = projectMinimap(n.x, n.z)}
			<circle
				cx={p.cx}
				cy={p.cy}
				r={n.selected ? 2.4 : 1.6}
				class:selected={n.selected}
				class="mm-node"
			/>
		{/each}
		<rect x={cam.cx - 8} y={cam.cy - 8} width="16" height="16" class="mm-view" />
	</svg>
</div>

<style>
	.world {
		width: 100%;
		height: 100%;
		min-height: 0;
		background: var(--yg-world-bg);
		position: relative;
	}

	.world :global(canvas) {
		display: block;
		width: 100%;
		height: 100%;
	}

	.minimap {
		position: absolute;
		right: 0.75rem;
		bottom: 0.75rem;
		width: 7.5rem;
		height: 7.5rem;
		border: 1px solid var(--yg-border);
		border-radius: 8px;
		background: color-mix(in srgb, var(--yg-world-bg) 88%, white);
		cursor: crosshair;
		opacity: 0.92;
	}

	.minimap-bg {
		fill: #24303c;
	}

	.mm-node {
		fill: #8a9aaa;
	}

	.mm-node.selected {
		fill: #c4a35a;
	}

	.mm-view {
		fill: none;
		stroke: #9ec5b8;
		stroke-width: 1.2;
	}
</style>
