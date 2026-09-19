<script lang="ts">
	import { Canvas } from '@threlte/core';
	import { app } from '$lib/session/app.svelte';
	import GraphScene from './GraphScene.svelte';
	import WorldHud from './WorldHud.svelte';

	const minimapNodes = $derived(
		Object.values(app.document.nodes).map((n) => ({
			id: n.id,
			x: n.position.x,
			z: n.position.z,
			selected: app.selection.nodeIds.includes(n.id)
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
		const cu = Math.min(1, Math.max(0, u));
		const cv = Math.min(1, Math.max(0, v));
		app.setCamera({
			target: {
				x: minX + cu * (maxX - minX),
				y: 0,
				z: minZ + cv * (maxZ - minZ)
			},
			distance: app.camera.distance
		});
	}

	function clientToNormalized(el: Element, clientX: number, clientY: number) {
		const rect = el.getBoundingClientRect();
		const w = rect.width || 1;
		const h = rect.height || 1;
		return {
			u: (clientX - rect.left) / w,
			v: (clientY - rect.top) / h
		};
	}

	let minimapDragging = $state(false);

	function onMinimapPointerDown(ev: PointerEvent) {
		if (ev.button !== 0) return;
		const el = ev.currentTarget as SVGSVGElement;
		el.setPointerCapture(ev.pointerId);
		minimapDragging = true;
		const { u, v } = clientToNormalized(el, ev.clientX, ev.clientY);
		panToNormalized(u, v);
	}

	function onMinimapPointerMove(ev: PointerEvent) {
		if (!minimapDragging) return;
		const el = ev.currentTarget as SVGSVGElement;
		const { u, v } = clientToNormalized(el, ev.clientX, ev.clientY);
		panToNormalized(u, v);
	}

	function onMinimapPointerUp(ev: PointerEvent) {
		if (!minimapDragging) return;
		const el = ev.currentTarget as SVGSVGElement;
		if (el.hasPointerCapture(ev.pointerId)) el.releasePointerCapture(ev.pointerId);
		minimapDragging = false;
	}

	function onMinimapKey(ev: KeyboardEvent) {
		if (ev.key === 'Enter' || ev.key === ' ') {
			ev.preventDefault();
			panToNormalized(0.5, 0.5);
		}
	}

	const mmFocus = $derived(projectMinimap(app.camera.target.x, app.camera.target.z));

	function fmt1(n: number) {
		return n.toFixed(1);
	}

	const camReadout = $derived({
		pan: fmt1(app.camera.panDeg),
		tilt: fmt1(app.camera.tiltDeg),
		x: fmt1(app.camera.eye.x),
		y: fmt1(app.camera.eye.y),
		z: fmt1(app.camera.eye.z)
	});
</script>

<div class="world" data-testid="yggnet-world">
	<Canvas>
		<GraphScene />
	</Canvas>

	<WorldHud />

	<div class="map-stack" data-testid="camera-panel">
		<nav class="cam-chrome" data-testid="camera-controls" aria-label="Camera controls">
			<button
				type="button"
				class="icon-btn"
				data-testid="camera-view-mode"
				aria-pressed={app.ui.viewMode === '2d'}
				aria-label={app.ui.viewMode === '2d' ? 'Switch to 3D view' : 'Switch to 2D view'}
				title={app.ui.viewMode === '2d' ? '2D view (click for 3D)' : '3D view (click for 2D)'}
				onclick={(e) => {
					app.toggleViewMode();
					// Don't leave focus styles looking like a special “2D active” color.
					(e.currentTarget as HTMLButtonElement).blur();
				}}
			>
				{#if app.ui.viewMode === '2d'}
					<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<!-- top-down flat map -->
						<rect x="4" y="4" width="16" height="16" rx="1.5" />
						<path d="M4 12h16M12 4v16" opacity="0.55" />
					</svg>
				{:else}
					<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<!-- isometric cube -->
						<path d="M12 3 20 7.5v9L12 21 4 16.5v-9L12 3Z" />
						<path d="M12 21v-9M20 7.5 12 12 4 7.5" />
					</svg>
				{/if}
			</button>
			<button
				type="button"
				class="icon-btn"
				data-testid="camera-reset-target"
				aria-label="Reset position to origin"
				title="Reset position (0, 0, 0)"
				onclick={() => app.resetCameraTarget()}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<!-- crosshair / origin -->
					<circle cx="11" cy="13" r="3.25" />
					<path d="M11 7.5v2.25M11 16.25V18.5M5.5 13h2.25M14.25 13H16.5" />
					<!-- reset badge (top-right) -->
					<g transform="translate(13.2 1.2) scale(0.42)" stroke-width="2.6">
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
					</g>
				</svg>
			</button>
			<button
				type="button"
				class="icon-btn"
				data-testid="camera-reset-orbit"
				aria-label="Reset camera angle"
				title="Reset camera angle"
				onclick={() => app.resetCameraOrbit()}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<!-- gimbal / orbit tilt -->
					<ellipse cx="11" cy="13" rx="7" ry="3.2" />
					<path d="M11 6.5v13" />
					<path d="M7.2 9.2c1.1 1.4 2.4 2.1 3.8 2.1s2.7-.7 3.8-2.1" />
					<path d="M7.2 16.8c1.1-1.4 2.4-2.1 3.8-2.1s2.7.7 3.8 2.1" />
					<!-- reset badge (top-right) -->
					<g transform="translate(13.2 1.2) scale(0.42)" stroke-width="2.6">
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
					</g>
				</svg>
			</button>
			<button
				type="button"
				class="icon-btn"
				data-testid="camera-reset-zoom"
				aria-label="Reset zoom"
				title="Reset zoom"
				onclick={() => app.resetCameraZoom()}
			>
				<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<!-- magnifier -->
					<circle cx="10.5" cy="12.5" r="5.25" />
					<path d="M14.8 16.8 19 21" />
					<!-- reset badge (top-right) -->
					<g transform="translate(13.2 1.2) scale(0.42)" stroke-width="2.6">
						<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
						<path d="M3 3v5h5" />
					</g>
				</svg>
			</button>
		</nav>

		<svg
			class="minimap"
			class:dragging={minimapDragging}
			data-testid="yggnet-minimap"
			viewBox="0 0 100 100"
			role="button"
			tabindex="0"
			aria-label="Minimap"
			onpointerdown={onMinimapPointerDown}
			onpointermove={onMinimapPointerMove}
			onpointerup={onMinimapPointerUp}
			onpointercancel={onMinimapPointerUp}
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
			<rect x={mmFocus.cx - 8} y={mmFocus.cy - 8} width="16" height="16" class="mm-view" />
		</svg>

		<div
			class="cam-readout"
			data-testid="camera-readout"
			aria-live="polite"
			aria-label="Pan {camReadout.pan}°, tilt {camReadout.tilt}°, position {camReadout.x}, {camReadout.y}, {camReadout.z}"
		>
			<div class="cam-row" title="Pan">
				<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<!-- yaw: turntable around vertical -->
					<path d="M12 3v8" />
					<ellipse cx="12" cy="16" rx="8" ry="5" />
					<path d="M19.6 14.2 21 16.8 17.4 16.6" />
				</svg>
				<span>{camReadout.pan}°</span>
			</div>
			<div class="cam-row" title="Tilt">
				<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<!-- pitch: look up/down -->
					<path d="M5 18a8.5 8.5 0 0 1 14 0" />
					<path d="M12 18V7" />
					<path d="M9.5 9.5 12 7l2.5 2.5" />
				</svg>
				<span>{camReadout.tilt}°</span>
			</div>
			<div class="cam-row" title="Position">
				<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
					<!-- xyz triad from origin -->
					<path d="M12 12V4" />
					<path d="M12 12l8 4.5" />
					<path d="M12 12 4 16.5" />
				</svg>
				<span>{camReadout.x}, {camReadout.y}, {camReadout.z}</span>
			</div>
		</div>
	</div>
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

	.map-stack {
		--cam-btn: 2.05rem;
		--cam-gap: 0.3rem;
		--panel-pad: 0.4rem;
		--inner-w: calc(4 * var(--cam-btn) + 3 * var(--cam-gap));
		position: absolute;
		left: 0.75rem;
		bottom: 0.75rem;
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0.3rem;
		box-sizing: border-box;
		width: calc(var(--inner-w) + 2 * var(--panel-pad) + 2px);
		padding: var(--panel-pad);
		border-radius: var(--yg-radius-panel);
		background: var(--yg-panel-glass-dim);
		border: 1px solid rgba(28, 36, 46, 0.1);
		box-shadow: 0 4px 16px rgba(28, 36, 46, 0.04);
		pointer-events: auto;
		transition:
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease),
			box-shadow var(--yg-motion) var(--yg-ease);
	}

	.map-stack:hover,
	.map-stack:focus-within {
		background: var(--yg-panel-glass);
		border-color: var(--yg-border);
		box-shadow: 0 6px 20px rgba(28, 36, 46, 0.12);
	}

	.cam-readout {
		display: flex;
		flex-direction: column;
		gap: 0.18rem;
		padding: 0.1rem 0.05rem 0;
		min-width: 0;
		width: 100%;
		color: var(--yg-fg);
		text-shadow: var(--yg-text-glow);
		font-family: ui-monospace, 'Cascadia Mono', 'Segoe UI Mono', monospace;
		font-size: 0.62rem;
		font-variant-numeric: tabular-nums;
		line-height: 1;
		letter-spacing: 0.02em;
		opacity: var(--yg-hud-idle-opacity);
		pointer-events: none;
		transition: opacity var(--yg-motion) var(--yg-ease);
	}

	.map-stack:hover .cam-readout,
	.map-stack:focus-within .cam-readout {
		opacity: var(--yg-hud-active-opacity);
	}

	.cam-row {
		display: grid;
		grid-template-columns: 0.9rem minmax(0, 1fr);
		align-items: center;
		gap: 0.35rem;
		min-width: 0;
	}

	.cam-row svg {
		width: 0.9rem;
		height: 0.9rem;
		display: block;
	}

	.cam-row span {
		min-width: 0;
		overflow: hidden;
		white-space: nowrap;
	}

	.minimap {
		position: relative;
		left: auto;
		bottom: auto;
		display: block;
		width: var(--inner-w);
		height: var(--inner-w);
		border: 1px solid rgba(158, 197, 184, 0.22);
		border-radius: var(--yg-radius-control);
		background: rgba(28, 36, 46, 0.28);
		box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.04) inset;
		cursor: crosshair;
		touch-action: none;
		pointer-events: auto;
		opacity: var(--yg-hud-idle-opacity);
		transition:
			opacity var(--yg-motion) var(--yg-ease),
			background var(--yg-motion) var(--yg-ease),
			border-color var(--yg-motion) var(--yg-ease),
			box-shadow var(--yg-motion) var(--yg-ease);
	}

	.minimap:hover,
	.minimap:focus-visible,
	.minimap.dragging {
		opacity: var(--yg-hud-active-opacity);
		background: rgba(28, 36, 46, 0.62);
		border-color: rgba(158, 197, 184, 0.45);
		box-shadow:
			0 0 0 1px rgba(255, 255, 255, 0.08) inset,
			0 4px 12px rgba(0, 0, 0, 0.18);
	}

	.map-stack:hover .minimap,
	.map-stack:focus-within .minimap {
		opacity: var(--yg-hud-active-opacity);
	}

	.minimap.dragging {
		cursor: grabbing;
	}

	.minimap-bg {
		fill: rgba(36, 48, 60, 0.35);
		stroke: rgba(158, 197, 184, 0.18);
		stroke-width: 1.5;
		transition:
			fill var(--yg-motion) var(--yg-ease),
			stroke var(--yg-motion) var(--yg-ease);
	}

	.minimap:hover .minimap-bg,
	.minimap:focus-visible .minimap-bg,
	.minimap.dragging .minimap-bg {
		fill: rgba(36, 48, 60, 0.55);
		stroke: rgba(158, 197, 184, 0.25);
	}

	.mm-node {
		fill: #8a9aaa;
		opacity: 0.55;
		transition: opacity var(--yg-motion) var(--yg-ease);
		pointer-events: none;
	}

	.minimap:hover .mm-node,
	.minimap:focus-visible .mm-node,
	.minimap.dragging .mm-node {
		opacity: 1;
	}

	.mm-node.selected {
		fill: #c4a35a;
	}

	.mm-view {
		fill: none;
		stroke: #9ec5b8;
		stroke-width: 1.2;
		opacity: 0.5;
		transition: opacity var(--yg-motion) var(--yg-ease);
		pointer-events: none;
	}

	.minimap:hover .mm-view,
	.minimap:focus-visible .mm-view,
	.minimap.dragging .mm-view {
		opacity: 1;
	}

	.cam-chrome {
		display: flex;
		align-items: center;
		gap: var(--cam-gap);
		width: var(--inner-w);
		padding: 0;
		pointer-events: auto;
	}

	.cam-chrome .icon-btn {
		display: inline-grid;
		place-items: center;
		flex: 0 0 var(--cam-btn);
		width: var(--cam-btn);
		height: var(--cam-btn);
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
			opacity var(--yg-motion) var(--yg-ease);
	}

	.map-stack:hover .cam-chrome .icon-btn,
	.map-stack:focus-within .cam-chrome .icon-btn {
		opacity: var(--yg-hud-active-opacity);
		background: var(--yg-chip);
		border-color: var(--yg-border);
	}

	.cam-chrome .icon-btn svg {
		width: 1.05rem;
		height: 1.05rem;
		display: block;
	}

	.map-stack:hover .cam-chrome .icon-btn:hover,
	.map-stack:focus-within .cam-chrome .icon-btn:hover {
		background: rgba(255, 255, 255, 0.72);
	}
</style>
